import mongoose from "mongoose";

export type Row = Record<string, any>;
export type Split = { train: Row[]; val: Row[]; test: Row[] };

export type TrainingDataProvider = {
  fetchRaw(params: {
    memberId?: string;
    source: string; // e.g., collection name or URL
    features: string[];
    target?: string;
    limit?: number;
    seed?: number;
  }): Promise<Split>;
};

export class MongoTrainingDataProvider implements TrainingDataProvider {
  async fetchRaw(params: {
    memberId?: string;
    source: string;
    features: string[];
    target?: string;
    limit?: number;
    seed?: number;
  }): Promise<Split> {
    const { memberId, source, features, target, limit = 50_000 } = params;

    // Use raw collection access for flexibility
    const collection = mongoose.connection.db?.collection(source);

    const projection: any = {};
    for (const f of features) projection[f] = 1;
    if (target) projection[target] = 1;
    // if (memberId) projection.memberId = 1;

    const filter: any = {};
    // if (memberId) {
    // 	// Attempt objectId match first, fallback to string
    // 	try {
    // 		filter.memberId = new (mongoose as any).Types.ObjectId(memberId);
    // 	} catch {
    // 		filter.memberId = memberId;
    // 	}
    // }

    const cursor = collection
      ?.find(filter)
      .project(projection)
      .limit(limit) as mongoose.mongo.FindCursor<mongoose.mongo.BSON.Document>;

    const rows: Row[] = [];
    for await (const doc of cursor) {
      rows.push(doc as Row);
    }

    // Stratified shuffle/split for classification when target is present and likely categorical
    const seed = params.seed ?? 0;
    if (target) {
      const groups = new Map<any, Row[]>();
      for (const r of rows) {
        // const key = (r as any)[target];
        const parts = target.split(".");
        let key = r;
        for (const part of parts) {
          key = key[part];
        }

        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)?.push(r);
      }

      const train: Row[] = [];
      const val: Row[] = [];
      const test: Row[] = [];
      for (const [, grp] of groups) {
        const g = shuffle(grp, seed);
        const n = g.length;
        const nTrain = Math.floor(n * 0.8);
        const nVal = Math.floor(n * 0.1);
        train.push(...g.slice(0, nTrain));
        val.push(...g.slice(nTrain, nTrain + nVal));
        test.push(...g.slice(nTrain + nVal));
      }
      return { train, val, test };
    }
    const shuffled = shuffle(rows, seed);
    const n = shuffled.length;
    const nTrain = Math.floor(n * 0.8);
    const nVal = Math.floor(n * 0.1);
    return {
      train: shuffled.slice(0, nTrain),
      val: shuffled.slice(nTrain, nTrain + nVal),
      test: shuffled.slice(nTrain + nVal),
    };
  }
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let m = a.length;
  let i: number;
  let s = seed || 1;
  while (m > 0) {
    s = (s * 9301 + 49_297) % 233_280; // LCG
    const rand = s / 233_280;
    i = Math.floor(rand * m--);
    [a[m], a[i]] = [a[i], a[m]];
  }
  return a;
}

export function resolveTrainingDataProvider(
  source: string
): TrainingDataProvider {
  // For now, treat non-URL strings as Mongo collections
  // biome-ignore lint/performance/useTopLevelRegex: ignore
  if (!(/^https?:\/\//i.test(source) || /^(s3|gs):\/\//i.test(source))) {
    return new MongoTrainingDataProvider();
  }
  // Future: CSV/Parquet providers for URL schemes
  return new MongoTrainingDataProvider();
}

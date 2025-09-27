import ChangelogCard from "@/components/changelog/changelog-card";
import type { ChangelogEntry } from "@/lib/changelog";
import { P } from "../common/typography";

type ChangelogListProps = {
  entries: ChangelogEntry[];
  limit?: number;
};

export default function ChangelogList({ entries, limit }: ChangelogListProps) {
  if (entries.length === 0) {
    return (
      <div>
        <P>No changelog entries found.</P>
      </div>
    );
  }

  const entriesToRender = limit ? entries.slice(0, limit) : entries;

  return (
    <div className="space-y-8">
      {entriesToRender.map((entry) => (
        <ChangelogCard entry={entry} key={entry.date} />
      ))}
    </div>
  );
}

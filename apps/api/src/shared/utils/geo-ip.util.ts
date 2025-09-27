import fs from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { Elysia } from "elysia";
import { ip } from "elysia-ip";
import { type CountryResponse, Reader } from "mmdb-lib";

// Path to the GeoIP database
const MMDB_PATH = join(process.cwd(), "./data/GeoLite2-Country.mmdb");
const dbBuffer = fs.readFileSync(MMDB_PATH);
const reader = new Reader<CountryResponse>(dbBuffer);

// Maximum number of entries in the cache
const CACHE_MAX_ENTRIES = 1000;

// LRU cache (naive implementation with Map)
const geoCache = new Map<string, CountryResponse | null>();

function getFromCache(ip: string): CountryResponse | null | undefined {
  const value = geoCache.get(ip);
  if (value !== undefined) {
    // move to the end to update "usage"
    geoCache.delete(ip);
    geoCache.set(ip, value);
  }
  return value;
}

function saveToCache(ip: string, value: CountryResponse | null) {
  if (geoCache.size >= CACHE_MAX_ENTRIES) {
    // remove the least recently used element
    const firstKey = geoCache.keys().next().value;
    if (firstKey) geoCache.delete(firstKey);
  }
  geoCache.set(ip, value);
}

export const geoIP = new Elysia({ name: "geo-ip" })
  .use(ip())
  .derive(({ ip }) => {
    if (!ip) return { geo: null as CountryResponse | null };

    const cached = getFromCache(ip);
    if (cached !== undefined) return { geo: cached };

    const geo = reader.get(ip) ?? null;
    saveToCache(ip, geo);
    return { geo };
  })
  .as("scoped");

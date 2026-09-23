import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE =
  "https://raw.githubusercontent.com/yoarikso/cpdvbible/master/cpdv-json/EntireBible-CPDV.json";

const here = dirname(fileURLToPath(import.meta.url));
const cacheFile = join(here, "..", ".cache", "cpdv.json");

export type Bible = Record<string, Record<string, Record<string, string>>>;

export type Reference = {
  bookKey: string;
  book: string;
  chapter: string;
  from: number;
  to: number;
};

const IRREGULAR: Record<string, string> = {
  SongOfSongs: "Song of Songs",
};

const ALIASES: Record<string, string> = {
  psalm: "psalms",
  songofsolomon: "songofsongs",
  canticles: "songofsongs",
  ecclesiasticus: "sirach",
  apocalypse: "revelation",
  qoheleth: "ecclesiastes",
};

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export async function loadBible(): Promise<Bible> {
  let raw: string;

  try {
    raw = await readFile(cacheFile, "utf8");
  } catch {
    const response = await fetch(SOURCE);
    if (!response.ok) {
      throw new Error(`Could not download the CPDV dataset: ${response.status}`);
    }
    raw = await response.text();
    await mkdir(dirname(cacheFile), { recursive: true });
    await writeFile(cacheFile, raw, "utf8");
  }

  const parsed = JSON.parse(raw) as Bible & { charset?: unknown };
  delete parsed.charset;
  return parsed;
}

export function displayName(bookKey: string) {
  return IRREGULAR[bookKey] ?? bookKey.replace(/-/g, " ");
}

export function parseReference(bible: Bible, reference: string): Reference {
  const cleaned = reference.replace(/\s*\(\d+\)/, "");
  const match = cleaned.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);

  if (!match) {
    throw new Error(`Malformed reference: ${reference}`);
  }

  const [, name, chapter, from, to] = match;
  const wanted = ALIASES[slug(name)] ?? slug(name);
  const bookKey = Object.keys(bible).find((key) => slug(key) === wanted);

  if (!bookKey) {
    throw new Error(`Unknown book in reference: ${reference}`);
  }

  return {
    bookKey,
    book: displayName(bookKey),
    chapter,
    from: Number(from),
    to: Number(to ?? from),
  };
}

export function verseText(bible: Bible, reference: string) {
  const { bookKey, book, chapter, from, to } = parseReference(bible, reference);
  const verses: string[] = [];

  for (let verse = from; verse <= to; verse += 1) {
    const text = bible[bookKey]?.[chapter]?.[String(verse)];
    if (!text) {
      throw new Error(`${book} ${chapter}:${verse} is not in the CPDV dataset`);
    }
    verses.push(text);
  }

  return verses.join(" ");
}

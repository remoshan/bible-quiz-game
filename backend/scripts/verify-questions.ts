import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadBible, parseReference, verseText, type Bible } from "./cpdv.ts";
import {
  EXPECTED_COUNTS,
  PROMPTS,
  TRANSLATION,
  questionBank,
  type Difficulty,
  type QuestionSpec,
} from "./question-bank.ts";

const BLANK = "______";
const MAX_VERSE_LENGTH = 260;

const seedFile = join(dirname(fileURLToPath(import.meta.url)), "..", "sql", "seed.sql");

type Row = {
  type: string;
  difficulty: Difficulty;
  prompt: string;
  verse_text: string;
  reference: string;
  translation: string;
  options: string[];
  correct_index: number;
};

const failures: string[] = [];

function check(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

function buildRow(bible: Bible, spec: QuestionSpec): Row {
  const label = `${spec.reference} (${spec.type})`;
  const source = verseText(bible, spec.reference);

  let verse = source;
  if (spec.strip) {
    check(source.startsWith(spec.strip), `${label}: strip prefix does not match the CPDV text`);
    verse = source.slice(spec.strip.length);
  }

  check(verse.length <= MAX_VERSE_LENGTH, `${label}: verse is ${verse.length} characters, over ${MAX_VERSE_LENGTH}`);
  check(spec.options.length === 4, `${label}: needs exactly 4 options`);
  check(new Set(spec.options).size === spec.options.length, `${label}: options repeat`);
  check(spec.options.every((option) => option.trim().length > 0), `${label}: has an empty option`);

  const correctIndex = spec.options.indexOf(spec.answer);
  check(correctIndex >= 0, `${label}: answer "${spec.answer}" is not among the options`);

  let display = verse;

  if (spec.type === "fill_in_the_blank") {
    check(spec.blank !== undefined, `${label}: fill_in_the_blank needs a blank`);
    check(spec.blank === spec.answer, `${label}: the blank and the answer must be the same words`);

    if (spec.blank) {
      const at = verse.indexOf(spec.blank);
      check(at >= 0, `${label}: "${spec.blank}" does not appear in the CPDV verse`);

      if (at >= 0) {
        display = verse.slice(0, at) + BLANK + verse.slice(at + spec.blank.length);
        check(
          display.replace(BLANK, spec.answer) === verse,
          `${label}: the blanked verse does not restore to the CPDV text`,
        );
      }
    }
  } else {
    check(spec.blank === undefined, `${label}: only fill_in_the_blank may declare a blank`);
    check(!verse.includes(spec.answer), `${label}: the verse gives away the answer "${spec.answer}"`);
  }

  if (spec.type === "guess_the_book") {
    const { book } = parseReference(bible, spec.reference);
    check(spec.answer === book, `${label}: answer "${spec.answer}" is not the book of this reference (${book})`);
  }

  return {
    type: spec.type,
    difficulty: spec.difficulty,
    prompt: PROMPTS[spec.type],
    verse_text: display,
    reference: spec.reference,
    translation: TRANSLATION,
    options: spec.options,
    correct_index: Math.max(correctIndex, 0),
  };
}

function checkBank(rows: Row[]) {
  const references = new Set<string>();
  const verses = new Set<string>();

  for (const row of rows) {
    check(!references.has(row.reference), `${row.reference}: used by more than one question`);
    check(!verses.has(row.verse_text), `${row.reference}: duplicates the verse text of another question`);
    references.add(row.reference);
    verses.add(row.verse_text);
  }

  for (const [difficulty, expected] of Object.entries(EXPECTED_COUNTS)) {
    const tier = rows.filter((row) => row.difficulty === difficulty);
    check(tier.length === expected, `${difficulty}: has ${tier.length} questions, expected ${expected}`);

    const spread = [0, 1, 2, 3].map((index) => tier.filter((row) => row.correct_index === index).length);
    check(
      Math.max(...spread) - Math.min(...spread) <= 2,
      `${difficulty}: answer positions are uneven (${spread.join(", ")})`,
    );
  }
}

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

function toSql(rows: Row[]) {
  const values = rows
    .map(
      (row) =>
        `  (${quote(row.type)}, ${quote(row.difficulty)}, ${quote(row.prompt)}, ${quote(row.verse_text)}, ` +
        `${quote(row.reference)}, ${quote(row.translation)}, ` +
        `array[${row.options.map(quote).join(", ")}], ${row.correct_index})`,
    )
    .join(",\n");

  return [
    "delete from public.questions;",
    "",
    "insert into public.questions (type, difficulty, prompt, verse_text, reference, translation, options, correct_index) values",
    `${values};`,
    "",
  ].join("\n");
}

const bible = await loadBible();
const rows = questionBank.map((spec) => buildRow(bible, spec));
checkBank(rows);

const sql = toSql(rows);

if (process.argv.includes("--write")) {
  await writeFile(seedFile, sql, "utf8");
  console.log(`Wrote ${rows.length} questions to sql/seed.sql`);
} else {
  const committed = await readFile(seedFile, "utf8").catch(() => "");
  check(
    committed.replace(/\r\n/g, "\n") === sql,
    "sql/seed.sql is out of date with the question bank; run npm run seed:write",
  );
}

if (failures.length > 0) {
  console.error(`${failures.length} problem(s) found:\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`${rows.length} questions verified against the CPDV text.`);

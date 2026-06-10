#!/usr/bin/env node
"use strict";

const fs   = require("fs");
const path = require("path");

const ROOT       = path.resolve(__dirname);
const INDEX_FILE = path.join(ROOT, "topics_index.json");
const TOPICS_DIR = path.join(ROOT, "topics");

const VALID_TYPES = new Set(["single", "multi", "matching", "fill_each", "sequence", "assertion"]);

const REQUIRED_FIELDS = {
  single:    ["q", "options", "correct"],
  multi:     ["q", "options", "correct"],
  matching:  ["q", "left", "right", "correct"],
  fill_each: ["q", "items", "answers"],
  sequence:  ["q", "items", "correct_order"],
  assertion: ["q", "statement1", "statement2", "correct"],
};

// ─── helpers ──────────────────────────────────────────────────────────────────

let issues = {};
let totalIssues = 0;

function report(file, msg) {
  if (!issues[file]) issues[file] = [];
  issues[file].push(msg);
  totalIssues++;
}

function loadJSON(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

// ─── 1. Validate topics_index.json ───────────────────────────────────────────

function validateIndex() {
  let index;
  try {
    index = loadJSON(INDEX_FILE);
  } catch (e) {
    report("topics_index.json", `INVALID JSON: ${e.message}`);
    return [];
  }

  if (!Array.isArray(index)) {
    report("topics_index.json", "top-level must be an array");
    return [];
  }

  const indexedFiles = new Set();

  index.forEach((entry, i) => {
    if (typeof entry !== "object" || entry === null) {
      report("topics_index.json", `entry ${i}: not an object`);
      return;
    }
    if (!("title" in entry)) report("topics_index.json", `entry ${i}: missing "title"`);
    if (!("file"  in entry)) { report("topics_index.json", `entry ${i}: missing "file"`); return; }

    const fname = entry.file;
    indexedFiles.add(fname);

    const fullPath = path.join(TOPICS_DIR, fname);
    if (!fs.existsSync(fullPath)) {
      report("topics_index.json", `entry ${i} ("${fname}"): file not found in topics/`);
    }
  });

  // orphaned files
  if (fs.existsSync(TOPICS_DIR)) {
    fs.readdirSync(TOPICS_DIR)
      .filter(f => f.endsWith(".json"))
      .forEach(fname => {
        if (!indexedFiles.has(fname)) {
          report("topics_index.json", `orphan: "${fname}" exists in topics/ but is not listed in the index`);
        }
      });
  }

  return index;
}

// ─── 2. Validate a single question ───────────────────────────────────────────

function validateQuestion(file, qi, q) {
  const label = () => {
    const text = (q.q || "").toString().slice(0, 60);
    return `Q${qi + 1}${text ? ` "${text}"` : ""}`;
  };

  if (typeof q !== "object" || q === null || Array.isArray(q)) {
    report(file, `${label()}: not an object`);
    return;
  }

  const type = q.type ?? null;   // undefined → null = plain q/a

  if (type !== null && !VALID_TYPES.has(type)) {
    report(file, `${label()}: unknown type "${type}"`);
    return;
  }

  // plain q/a
  if (type === null) {
    if (!("q" in q) && !("a" in q)) {
      report(file, `${label()}: plain q/a entry must have at least "q" or "a"`);
    }
    return;
  }

  // required fields
  (REQUIRED_FIELDS[type] || []).forEach(field => {
    if (!(field in q)) report(file, `${label()} (${type}): missing field "${field}"`);
  });

  // type-specific range checks
  if (type === "single" || type === "multi") {
    const opts    = q.options;
    const correct = q.correct;
    if (!Array.isArray(opts) || opts.length === 0) {
      report(file, `${label()}: "options" must be a non-empty array`);
      return;
    }
    const n = opts.length;
    if (type === "single") {
      if (typeof correct !== "number" || !Number.isInteger(correct)) {
        report(file, `${label()}: single "correct" must be an integer`);
      } else if (correct < 0 || correct >= n) {
        report(file, `${label()}: correct=${correct} out of range [0, ${n - 1}]`);
      }
    } else {
      if (!Array.isArray(correct)) {
        report(file, `${label()}: multi "correct" must be an array`);
      } else {
        correct.forEach(idx => {
          if (!Number.isInteger(idx) || idx < 0 || idx >= n) {
            report(file, `${label()}: multi correct index ${idx} out of range [0, ${n - 1}]`);
          }
        });
      }
    }
  }

  if (type === "matching") {
    const left  = q.left;
    const right = q.right;
    const corr  = q.correct;
    if (!Array.isArray(left))  report(file, `${label()}: "left" must be an array`);
    if (!Array.isArray(right)) report(file, `${label()}: "right" must be an array`);
    if (typeof corr === "object" && corr !== null && !Array.isArray(corr)
        && Array.isArray(left) && Array.isArray(right)) {
      Object.entries(corr).forEach(([k, v]) => {
        const ki = parseInt(k, 10);
        if (isNaN(ki) || ki < 0 || ki >= left.length) {
          report(file, `${label()}: correct key "${k}" out of range for left[0..${left.length - 1}]`);
        }
        if (!Number.isInteger(v) || v < 0 || v >= right.length) {
          report(file, `${label()}: correct["${k}"]=${v} out of range for right[0..${right.length - 1}]`);
        }
      });
    } else if (corr !== undefined && (typeof corr !== "object" || Array.isArray(corr))) {
      report(file, `${label()}: "correct" must be an object {"leftIdx": rightIdx, ...}`);
    }
  }

  if (type === "fill_each") {
    const items   = q.items;
    const answers = q.answers;
    if (Array.isArray(items) && Array.isArray(answers) && items.length !== answers.length) {
      report(file, `${label()}: len(items)=${items.length} !== len(answers)=${answers.length}`);
    }
  }

  if (type === "sequence") {
    const items = q.items;
    const co    = q.correct_order;
    const n     = Array.isArray(items) ? items.length : 0;
    if (!Array.isArray(co)) {
      report(file, `${label()}: "correct_order" must be an array`);
    } else {
      const expected = Array.from({ length: n }, (_, i) => i);
      if (JSON.stringify([...co].sort((a, b) => a - b)) !== JSON.stringify(expected)) {
        report(file, `${label()}: correct_order ${JSON.stringify(co)} is not a permutation of 0..${n - 1}`);
      }
    }
  }

  if (type === "assertion") {
    const corr = q.correct;
    if (corr !== undefined && (!Number.isInteger(corr) || corr < 0 || corr > 4)) {
      report(file, `${label()}: assertion correct=${JSON.stringify(corr)} must be an integer 0–4`);
    }
  }
}

// ─── 3. Validate a single topic file ─────────────────────────────────────────

function validateTopicFile(filePath) {
  const fname = path.basename(filePath);
  let data;
  try {
    data = loadJSON(filePath);
  } catch (e) {
    report(fname, `INVALID JSON: ${e.message}`);
    return;
  }

  let questions;
  if (Array.isArray(data)) {
    questions = data;
  } else if (data && typeof data === "object" && Array.isArray(data.questions)) {
    questions = data.questions;
  } else {
    report(fname, 'top-level must be an array or { "title": "...", "questions": [...] }');
    return;
  }

  questions.forEach((q, i) => validateQuestion(fname, i, q));
}

// ─── main ─────────────────────────────────────────────────────────────────────

const index = validateIndex();

if (fs.existsSync(TOPICS_DIR)) {
  fs.readdirSync(TOPICS_DIR)
    .filter(f => f.endsWith(".json"))
    .sort()
    .forEach(fname => validateTopicFile(path.join(TOPICS_DIR, fname)));
} else {
  console.error(`topics/ directory not found at ${TOPICS_DIR}`);
  process.exit(1);
}

if (totalIssues === 0) {
  console.log("OK — no issues found.");
} else {
  console.log(`\nFOUND ${totalIssues} issue(s) in ${Object.keys(issues).length} file(s):\n`);
  for (const [file, msgs] of Object.entries(issues).sort()) {
    console.log(`  [${file}]`);
    msgs.forEach(m => console.log(`    - ${m}`));
    console.log();
  }
  process.exit(1);
}

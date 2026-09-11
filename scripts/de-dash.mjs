#!/usr/bin/env node
/**
 * de-dash.mjs — remove em dashes (—) and en dashes (–) from existing posts.
 *
 * Sends each post body to DeepSeek with a NARROW instruction: replace dashes
 * with context-correct punctuation and write numeric ranges ("3–4") as "3 to 4",
 * changing nothing else. Frontmatter is preserved verbatim. A deterministic
 * sweep then guarantees zero remaining dashes (stragglers become a comma).
 *
 * Usage:
 *   DEEPSEEK_API_KEY=... node scripts/de-dash.mjs              # all posts
 *   DEEPSEEK_API_KEY=... node scripts/de-dash.mjs bee-lawn.mdx # one post
 *   DEEPSEEK_API_KEY=... node scripts/de-dash.mjs --dry-run    # preview diffs only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const SYSTEM_PROMPT = `You are a copy editor. Rewrite the text I give you so it contains NO em dashes (—) and NO en dashes (–).

Replace each dash with the punctuation that fits the sentence best:
- a period (start a new sentence)
- a comma (a tight aside)
- a colon (introducing an explanation or a list)
- parentheses (a true aside)
- or restructure the sentence so no dash is needed.

For numeric ranges written with an en dash (for example "3–4", "6.5–7.0", "2–3"), write them out as "3 to 4", "6.5 to 7.0", "2 to 3".

Do NOT change any other wording, spelling, facts, names, numbers, dates, quotes, links, or Markdown structure (headings, lists, tables, links, images, inline code, and any \`\`\`napkin fenced blocks must pass through unchanged). Change only the dashes and the punctuation immediately around them.

Output ONLY the rewritten text. No preamble, no explanation, no code fences.`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitFrontmatter(raw) {
  if (!raw.startsWith('---')) return { head: '', body: raw };
  const firstNL = raw.indexOf('\n');
  if (firstNL === -1) return { head: raw, body: '' };
  const close = /\r?\n---[ \t]*\r?\n/.exec(raw.slice(firstNL));
  if (!close) return { head: raw, body: '' };
  const closeEnd = firstNL + close.index + close[0].length;
  return { head: raw.slice(0, closeEnd), body: raw.slice(closeEnd) };
}

function stripFence(text) {
  let t = (text || '').trim();
  if (t.startsWith('```markdown') && t.endsWith('```')) t = t.slice(11, -3);
  else if (t.startsWith('```') && t.endsWith('```')) t = t.slice(3, -3);
  return t;
}

function countDashes(text) {
  return {
    em: (text.match(/\u2014/g) || []).length,
    en: (text.match(/\u2013/g) || []).length,
  };
}

/** Guarantee zero dashes: handle any the model missed. Stragglers become a comma. */
function mechanicalSweep(text) {
  let out = text;
  // Numeric en-dash ranges -> "3 to 4"
  out = out.replace(/(\d)\s*\u2013\s*(\d)/g, '$1 to $2');
  // Any remaining en dash (punctuation) -> comma
  out = out.replace(/\s*\u2013\s*/g, ', ');
  // Em dashes -> comma
  out = out.replace(/\s*\u2014\s*/g, ', ');
  // Collapse any accidental ", ," or trailing " ," artifacts
  out = out.replace(/,\s*,/g, ',').replace(/\s+,/g, ',');
  return out;
}

async function deDashBody(body) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: body },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const files = argv.filter((a) => !a.startsWith('--'));
  return { dryRun, files };
}

function resolveFiles(requested) {
  const all = fs.readdirSync(BLOG_DIR).filter((f) => /\.(md|mdx)$/i.test(f)).sort();
  if (!requested.length) return all;
  const want = new Set(requested.map((f) => (f.endsWith('.mdx') || f.endsWith('.md') ? f : `${f}.mdx`)));
  const found = all.filter((f) => want.has(f));
  if (!found.length) {
    console.error(`No matching posts for: ${requested.join(', ')}`);
    process.exit(2);
  }
  return found;
}

function lineDiff(a, b) {
  const al = a.split('\n');
  const bl = b.split('\n');
  let start = 0;
  while (start < al.length && start < bl.length && al[start] === bl[start]) start++;
  let endA = al.length;
  let endB = bl.length;
  while (endA > start && endB > start && al[endA - 1] === bl[endB - 1]) {
    endA--;
    endB--;
  }
  return { start, oldLines: al.slice(start, endA), newLines: bl.slice(start, endB) };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { dryRun, files: requested } = parseArgs(process.argv.slice(2));
  const files = resolveFiles(requested);

  console.log(`De-dashing ${files.length} post(s)${dryRun ? ' (DRY RUN)' : ''}.\n`);

  let totalEm = 0;
  let totalEn = 0;

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { head, body } = splitFrontmatter(raw);
    const before = countDashes(body);

    if (before.em === 0 && before.en === 0) {
      console.log(`- ${file}: no dashes`);
      continue;
    }
    totalEm += before.em;
    totalEn += before.en;

    if (!DEEPSEEK_API_KEY) {
      console.log(`- ${file}: skip (no DEEPSEEK_API_KEY) — ${before.em} em, ${before.en} en remaining`);
      continue;
    }

    try {
      let out = stripFence(await deDashBody(body));
      // Refuse a truncated/corrupted result (dash removal should not shrink much).
      if (!out || out.length < body.length * 0.5) {
        console.log(`- ${file}: skip (unsafe/empty result)`);
        continue;
      }
      out = mechanicalSweep(out);
      const after = countDashes(out);

      if (out === body) {
        console.log(`- ${file}: no change`);
        continue;
      }

      if (dryRun) {
        console.log(`- ${file}: would remove ${before.em - after.em} em, ${before.en - after.en} en (${after.em} em, ${after.en} en left):`);
        const d = lineDiff(body, out);
        const n = Math.min(d.oldLines.length, d.newLines.length, 12);
        for (let i = 0; i < n; i++) {
          if (d.oldLines[i] !== d.newLines[i]) {
            console.log(`    - ${d.oldLines[i].trim()}`);
            console.log(`    + ${d.newLines[i].trim()}`);
          }
        }
      } else {
        fs.writeFileSync(filePath, head + out, 'utf8');
        console.log(`\u2705 ${file}: ${before.em} em / ${before.en} en -> ${after.em} em / ${after.en} en`);
      }
    } catch (e) {
      console.log(`- ${file}: error (${e.message})`);
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\nFinished. Total dashes found: ${totalEm} em, ${totalEn} en.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

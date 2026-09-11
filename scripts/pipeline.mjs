#!/usr/bin/env node
/**
 * pipeline.mjs — one-pass content pipeline for GaiaVerity blog posts.
 *
 * For each post (in order) it runs three steps:
 *   1. HUMANIZE  — rewrite the prose to strip AI-writing tells (DeepSeek).
 *   2. NAPKIN    — insert a single ```napkin diagram block (DeepSeek).
 *   3. HERO      — fetch a topic-matched Pexels hero image and write it into
 *                  the frontmatter `image:` field, deduped against all posts.
 *
 * Idempotent: re-running skips steps that already ran (humanized flag, existing
 * napkin block, existing unique image) unless you pass --force-hero.
 *
 * Usage:
 *   DEEPSEEK_API_KEY=... PEXELS_API_KEY=... node scripts/pipeline.mjs [files...]
 *   node scripts/pipeline.mjs bee-lawn.mdx moss-lawn.mdx        # just these
 *   node scripts/pipeline.mjs --dry-run                          # report only
 *   node scripts/pipeline.mjs --skip-humanize --skip-napkin      # hero only
 *
 * Flags:
 *   --dry-run         print what would change, write nothing
 *   --skip-humanize   skip step 1
 *   --skip-napkin     skip step 2
 *   --skip-hero       skip step 3
 *   --force-hero      overwrite even a unique existing hero image
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const HUMANIZER_SYSTEM = `You are an editorial assistant that removes signs of AI-generated writing so prose reads as if a specific human wrote it. You run in "embedded mode": output ONLY the rewritten text, with no preamble, no explanation, and no code fences.

HARD RULES:
1. Preserve every fact, name, number, date, quote, citation, and link exactly. NEVER invent or add a factual claim. If a vague claim needs a real detail you do not have, write the plain version without inventing one.
2. Preserve the information, not the shape. You may compress dull parts, dwell where a human would, and merge or split paragraphs. When keeping structure and keeping information conflict, the information wins.
3. Match the author's voice. The GaiaVerity voice is trustworthy, unhurried, and curious: earthy, specific, calm, never salesy or clickbaity. Keep occasional short sentence fragments for rhythm. Do not inject first person or opinion into neutral passages.
4. Preserve Markdown structure exactly: headings, lists, tables, links, images, inline code, and any \`\`\`napkin fenced block must pass through unchanged. Humanize the prose around them, not the formatting.
5. Only rewrite prose that shows AI tells. If a passage already reads like a specific human wrote it (unusual detail, mixed feelings, dated references, uneven rhythm), leave it alone.
6. Em and en dashes are a HARD constraint, not a style preference: the final rewrite must contain NO em dashes (—) or en dashes (–). Replace each one, in rough order of preference: a period (start a new sentence), a comma (a tight aside), a colon (introducing an explanation), parentheses (a true aside), or restructure the sentence. Also catch spaced em dashes ( " — " ) and double hyphens ( -- ) used the same way. Before returning, scan the rewrite for "—" and "–"; any hit means it is not done.

Strip these AI tells when you see them (rewrite; do not over-flag isolated instances — look for CLUSTERS):
- Inflated significance/legacy: "stands as", "is a testament to", "pivotal", "crucial", "underscores", "reflects broader", "evolving landscape", "deeply rooted".
- Promotional language: "boasts", "vibrant", "stunning", "breathtaking", "nestled", "in the heart of", "renowned", "must-visit", "rich heritage".
- AI vocabulary: "delve", "showcase", "tapestry", "interplay", "foster", "garner", "underscore", "highlight", "robust", "seamless", "leverage", "landscape" (abstract).
- Superficial -ing analyses tacked on as fake depth: "highlighting…", "underscoring…", "reflecting…", "showcasing…", "ensuring…".
- Vague attributions ("experts argue", "observers note", "industry reports") without a named source — name the real source or cut the claim.
- Copula avoidance: "serves as" / "boasts" / "features" where "is" / "has" is plainer.
- Negative parallelisms: "not only… but…", "it's not just X, it's Y".
- Rule of three (forced triads), elegant variation (cycling synonyms), false ranges ("from X to Y" off a real scale).
- Passive voice or subjectless fragments where active voice is clearer.
- Filler ("in order to", "due to the fact that", "at this point in time", "it is important to note that"), excessive hedging ("could potentially possibly").
- Generic positive conclusions ("the future looks bright…") — cut and end on the last concrete fact.
- Persuasive-authority tropes ("the real question is", "at its core", "what really matters"), signposting ("let's dive in", "here's what you need to know").
- Fragmented headers (a heading followed by a one-line restatement — drop the restatement).
- Manufactured punchlines / staccato drama (runs of clipped fragments), aphorism formulas ("X is the Y of Z", "the language of", "the currency of"), conversational rhetorical openers ("Honestly?", "Look,", "Here's the thing").
- Mechanical boldface, Title Case in headings, emojis in headings/bullets, curly quotes (straighten to " and '), and hyphenated compounds in predicate position ("the report is high-quality" → "high quality").

Do NOT flag on their own: one "however", curly quotes alone, perfect grammar, formal vocabulary, one short sentence, or unsourced claims. Deliver only the final rewrite of the body I give you. No commentary.`;

const NAPKIN_SYSTEM = `You are an editorial assistant that adds diagrams to blog posts.

Given a Markdown blog post, choose ONE concept worth diagramming and return it as a single JSON object.

Respond with ONLY the JSON object — no explanation, no markdown fences — in exactly this shape:
{"anchor":"<exact text to insert after>","diagram":"<the diagram content>"}

Rules:
1. "anchor" MUST be an exact, verbatim substring of the post. Copy a full sentence or a heading line character-for-character (including punctuation). It must be unique enough to locate unambiguously in the post.
2. "diagram" is the content for a Napkin diagram. Format it based on the concept:
   - Step-by-step process -> "Create a flowchart:\nStep 1 -> Step 2 -> Step 3"
   - Repeating cycle -> "Create a circular flowchart:\nStage 1 -> Stage 2 -> Stage 3 -> Stage 1"
   - Categories/hierarchy -> "Create a mind map:\n- Core\n  - Category A\n  - Category B"
3. Pick the most visually diagrammable concept (a process, cycle, hierarchy, comparison, or step-by-step list). If nothing stands out, still choose the best paragraph and diagram it.
4. Output ONLY the JSON object.`;

// ---------------------------------------------------------------------------
// Frontmatter surgery (preserves everything except the fields we touch)
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

/** Set the `image:` frontmatter value, handling folded (`>-`) and same-line forms. */
function setImage(head, url) {
  const lines = head.split('\n');
  const idx = lines.findIndex((l) => /^[ \t]*image:[ \t]*/.test(l));
  const quoted = `image: "${url}"`;

  if (idx === -1) {
    const closeIdx = lines.map((l) => l.trim()).lastIndexOf('---');
    lines.splice(closeIdx >= 0 ? closeIdx : lines.length, 0, quoted);
    return lines.join('\n');
  }

  const isFolded = /^[ \t]*image:[ \t]*[>|][+-]?[ \t]*$/.test(lines[idx]);
  if (isFolded) {
    let j = idx + 1;
    while (j < lines.length && /^[ \t]+/.test(lines[j])) j++;
    lines.splice(idx, j - idx, quoted);
  } else {
    lines[idx] = quoted;
  }
  return lines.join('\n');
}

/** Insert or replace a single scalar frontmatter key (e.g. `humanized: true`). */
function upsertScalar(head, key, value) {
  const lines = head.split('\n');
  const re = new RegExp(`^[ \\t]*${key}:[ \\t]*`);
  const idx = lines.findIndex((l) => re.test(l));
  if (idx === -1) {
    const closeIdx = lines.map((l) => l.trim()).lastIndexOf('---');
    lines.splice(closeIdx >= 0 ? closeIdx : lines.length, 0, `${key}: ${value}`);
  } else {
    lines[idx] = `${key}: ${value}`;
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Canonical image identity (same rule as check-hero-images.mjs)
// ---------------------------------------------------------------------------

function canonicalKey(image) {
  if (typeof image !== 'string' || !image.length) return null;
  const unsplash = image.match(/images\.unsplash\.com\/photo-([0-9]+-[a-f0-9]+)/i);
  if (unsplash) return `unsplash:${unsplash[1].toLowerCase()}`;
  const pexels = image.match(/images\.pexels\.com\/photos\/(\d+)\//i);
  if (pexels) return `pexels:${pexels[1]}`;
  if (/^https?:\/\//i.test(image)) return `url:${image.split('?')[0].toLowerCase()}`;
  return `local:${image.replace(/\\/g, '/')}`;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

function stripFence(text) {
  let t = (text || '').trim();
  if (t.startsWith('```markdown') && t.endsWith('```')) t = t.slice(11, -3);
  else if (t.startsWith('```') && t.endsWith('```')) t = t.slice(3, -3);
  return t.trim();
}

async function callDeepSeek(system, user, { json = false } = {}) {
  const body = {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.3,
  };
  if (json) body.response_format = { type: 'json_object' };

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

async function humanizeBody(body) {
  const out = stripFence(await callDeepSeek(HUMANIZER_SYSTEM, body));
  if (!out) return null;
  // Guard against truncation/corruption: refuse a suspiciously tiny result.
  if (out.length < Math.max(100, body.length * 0.25)) return null;
  return out;
}

async function napkinBlock(body) {
  const raw = await callDeepSeek(NAPKIN_SYSTEM, body, { json: true });
  try {
    const parsed = JSON.parse(raw);
    if (parsed.anchor && parsed.diagram) return parsed;
  } catch {}
  return null;
}

async function chooseHero(query, takenKeys) {
  if (!PEXELS_API_KEY) return null;
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
    if (!res.ok) return null;
    const data = await res.json();
    for (const photo of data.photos || []) {
      const key = `pexels:${photo.id}`;
      if (!takenKeys.has(key)) {
        return { url: photo.src.large2x || photo.src.large, key };
      }
    }
  } catch {}
  return null;
}

function heroQuery(data) {
  const tags = (Array.isArray(data.tags) ? data.tags : []).filter(Boolean);
  if (tags.length) return tags[0];
  const title = (data.title || '').split(/[:—–|-]/)[0].trim();
  return title || 'garden';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const flags = { dryRun: false, skipHumanize: false, skipNapkin: false, skipHero: false, forceHero: false };
  const files = [];
  for (const a of argv) {
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--skip-humanize') flags.skipHumanize = true;
    else if (a === '--skip-napkin') flags.skipNapkin = true;
    else if (a === '--skip-hero') flags.skipHero = true;
    else if (a === '--force-hero') flags.forceHero = true;
    else files.push(a);
  }
  return { flags, files };
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

async function main() {
  const { flags, files: requested } = parseArgs(process.argv.slice(2));
  const files = resolveFiles(requested);

  // Build the current image-key -> owners map for dedupe.
  const keyOwners = new Map();
  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
    const { data } = matter(raw);
    const key = canonicalKey(data.image);
    if (key) {
      if (!keyOwners.has(key)) keyOwners.set(key, new Set());
      keyOwners.get(key).add(file);
    }
  }

  console.log(`Processing ${files.length} post(s)${flags.dryRun ? ' (DRY RUN)' : ''}.\n`);

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    let { head, body } = splitFrontmatter(raw);
    const data = parsed.data;
    const report = [];

    // 1. Humanize
    if (!flags.skipHumanize) {
      if (data.humanized === true) {
        report.push('humanize: skip (already humanized)');
      } else if (!DEEPSEEK_API_KEY) {
        report.push('humanize: skip (no DEEPSEEK_API_KEY)');
      } else {
        try {
          const out = await humanizeBody(body);
          if (out) {
            body = out;
            head = upsertScalar(head, 'humanized', 'true');
            report.push('humanize: done');
          } else {
            report.push('humanize: skip (unsafe/empty result)');
          }
        } catch (e) {
          report.push(`humanize: error (${e.message})`);
        }
      }
    }

    // 2. Napkin
    if (!flags.skipNapkin) {
      if (body.includes('```napkin')) {
        report.push('napkin: skip (already present)');
      } else if (!DEEPSEEK_API_KEY) {
        report.push('napkin: skip (no DEEPSEEK_API_KEY)');
      } else {
        try {
          const block = await napkinBlock(body);
          if (block && body.includes(block.anchor)) {
            const idx = body.indexOf(block.anchor);
            const anchorEnd = idx + block.anchor.length;
            const lineEnd = body.indexOf('\n', anchorEnd);
            const insertAt = lineEnd === -1 ? body.length : lineEnd + 1;
            const fenced = `\`\`\`napkin\n${block.diagram}\n\`\`\``;
            body = body.slice(0, insertAt) + fenced + '\n\n' + body.slice(insertAt);
            report.push('napkin: done');
          } else {
            report.push('napkin: skip (anchor not found verbatim)');
          }
        } catch (e) {
          report.push(`napkin: error (${e.message})`);
        }
      }
    }

    // 3. Hero image
    if (!flags.skipHero) {
      const curKey = canonicalKey(data.image);
      const owners = curKey ? keyOwners.get(curKey) : null;
      const isDuplicate = !!(owners && owners.size > 1);
      const needsHero = !data.image || isDuplicate || flags.forceHero;

      if (!needsHero) {
        report.push('hero: skip (unique image present)');
      } else if (!PEXELS_API_KEY) {
        report.push('hero: skip (no PEXELS_API_KEY)');
      } else {
        const taken = new Set(keyOwners.keys());
        if (curKey && !isDuplicate && !flags.forceHero) taken.delete(curKey);
        const picked = await chooseHero(heroQuery(data), taken);
        if (picked) {
          head = setImage(head, picked.url);
          if (curKey) {
            keyOwners.get(curKey)?.delete(file);
            if (keyOwners.get(curKey)?.size === 0) keyOwners.delete(curKey);
          }
          if (!keyOwners.has(picked.key)) keyOwners.set(picked.key, new Set());
          keyOwners.get(picked.key).add(file);
          report.push(`hero: ${picked.url}`);
        } else {
          report.push('hero: skip (no unique Pexels result)');
        }
      }
    }

    const next = head + body;
    if (next === raw) {
      console.log(`- ${file}: no change (${report.join('; ')})`);
    } else if (flags.dryRun) {
      console.log(`- ${file}: WOULD CHANGE (${report.join('; ')})`);
    } else {
      fs.writeFileSync(filePath, next, 'utf8');
      console.log(`\u2705 ${file}: ${report.join('; ')}`);
    }

    // Rate-limit courtesy between files.
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log('\nFinished.');
}

export { splitFrontmatter, setImage, upsertScalar, canonicalKey };

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

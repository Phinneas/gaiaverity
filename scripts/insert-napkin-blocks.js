import fs from 'fs';
import path from 'path';

// Run with: DEEPSEEK_API_KEY=your_key_here node scripts/insert-napkin-blocks.js
//
// SAFE INSERTION PATTERN:
// Instead of asking DeepSeek to return the whole file (which caused content
// truncation/corruption), we ask it to return ONLY a small JSON object:
//   { "anchor": "<exact sentence/heading>", "diagram": "<diagram text>" }
// The script then locates the anchor and inserts the ```napkin block after it,
// leaving every other byte of the file untouched.

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

if (!API_KEY) {
  console.error("Error: DEEPSEEK_API_KEY environment variable is missing.");
  process.exit(1);
}

const SYSTEM_PROMPT = `You are an editorial assistant that adds diagrams to blog posts.

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

async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const base = path.basename(filePath);

  // Idempotent: never double-insert
  if (content.includes('```napkin')) {
    console.log(`\u23ed\ufe0f  Skipping ${base} (already has a napkin block)`);
    return;
  }

  console.log(`Processing: ${base}...`);

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let raw = (data.choices?.[0]?.message?.content || '').trim();

    // Strip any ```json fence the model might add anyway
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn(`  Warning: non-JSON response for ${base} — skipping (no change).`);
      return;
    }

    const anchor = parsed.anchor;
    const diagram = parsed.diagram;

    if (!anchor || !diagram) {
      console.warn(`  Warning: missing anchor/diagram for ${base} — skipping (no change).`);
      return;
    }

    const idx = content.indexOf(anchor);
    if (idx === -1) {
      console.warn(`  Warning: anchor not found verbatim in ${base} — skipping (no change).`);
      return;
    }

    // Insert after the END of the line containing the anchor (diagrams read best between blocks)
    const anchorEnd = idx + anchor.length;
    const lineEnd = content.indexOf('\n', anchorEnd);
    const insertAt = lineEnd === -1 ? content.length : lineEnd + 1;

    const block = `\`\`\`napkin\n${diagram}\n\`\`\``;
    const newContent = content.slice(0, insertAt) + block + '\n\n' + content.slice(insertAt);

    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`  \u2705 Success: block added to ${base} after "${anchor.substring(0, 60)}..."`);
  } catch (error) {
    console.error(`  \u274c Failed to process ${base}:`, error.message);
  }
}

async function main() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
  console.log(`Found ${files.length} MDX files to process.`);
  for (const file of files) {
    await processFile(path.join(BLOG_DIR, file));
    await new Promise(resolve => setTimeout(resolve, 2000)); // rate-limit courtesy
  }
  console.log("Finished processing all files!");
}

main();

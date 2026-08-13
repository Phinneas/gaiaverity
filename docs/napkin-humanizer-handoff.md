# Content Pipeline Handoff: Humanizer + Napkin AI Diagrams

A reusable playbook for adding two content systems to a project:

1. **Humanizer** — an AI writing skill that strips "AI tells" from drafts before publishing.
2. **Napkin.ai diagrams** — programmatic text-to-diagram images injected into long-form content at build time, placed automatically by a DeepSeek-powered script.

Originally built for **gaiaverity** (Astro + MDX + Cloudflare Pages). The Napkin API portion is framework-agnostic; only the "remark plugin" wiring is Astro-specific.

---

## 1. Overview of the pipeline

```
Author writes .mdx content
        │
        ▼
[DeepSeek script]  reads each post, picks ONE best spot,
                   inserts a ```napkin code block
        │
        ▼
[Astro build]      a custom remark plugin finds ```napkin blocks,
                   calls the Napkin API (async 3-step),
                   downloads the image, swaps the block for <img>
        │
        ▼
Serves a static PNG hosted from /public/diagrams/
```

Two separate API keys are involved, used at different times:

| Key | Used by | Where it runs | Purpose |
|-----|---------|---------------|---------|
| `DEEPSEEK_API_KEY` | `scripts/insert-napkin-blocks.js` | **Your local machine** | Chooses where to put diagrams and writes `napkin` blocks into the `.mdx` files |
| `NAPKIN_API_KEY` (or `NAPKIN_API_TOKEN`) | `src/plugins/remark-napkin.mjs` | **Build server (Cloudflare)** | Turns each `napkin` block into an actual image |

Key insight: **DeepSeek edits text locally; Napkin renders images at build time.** They never run in the same place.

---

## 2. Prerequisites

### DeepSeek key (authoring)
1. Go to `platform.deepseek.com` → **API Keys** → **Create API key**.
2. Copy the full key. It **must** start with `sk-` and be 30+ chars.
   - ⚠️ Do NOT use the "tracking id" / account id — that is not the auth secret.
3. Your account needs a positive balance (a `$0` balance surfaces as an auth error, not a balance error).

### Napkin key (rendering)
1. Go to `app.napkin.ai` → **Account/Team Settings** → **Developers** tab → **Create API token**.
2. Docs: `https://api.napkin.ai` (Docusaurus). Current API version `1.1.16`.
3. Set it as a secret on your host (e.g. Cloudflare Pages → Settings → Environment Variables → **Production**), named `NAPKIN_API_KEY`.

---

## 3. Component 1 — Humanizer skill

This is a portable Markdown skill (no code to write). It detects and removes ~33 patterns of AI writing (em-dash overuse, "delve/testament/vibrant", rule-of-three, signposting, etc.).

### Install
```bash
npx skills add blader/humanizer -y
```

This installs it project-locally (`.agents/skills/humanizer/` + symlinks). Commit it.

### Use (three modes)
- **Pasted text:** `"Humanize this text: <paste>"`
- **File mode (in place):** `"Humanize the prose in path/to/file.md"` — rewrites the file, preserves frontmatter/code blocks.
- **Embedded mode:** as one step of a larger job; outputs only final text.

The skill's `SKILL.md` is the runtime artifact — copy it into any harness's skill dir to use it elsewhere. Voice-calibration: give it a sample of the author's real writing and it matches that voice instead of producing generic "clean" prose.

---

## 4. Component 2 — DeepSeek block-insertion script

File: `scripts/insert-napkin-blocks.js`

It loops over every `.mdx` file, sends the full post to DeepSeek, and asks the model to return the file with exactly ONE ````napkin` block inserted at the best location. It skips files that already contain a ````napkin` block (idempotent re-runs).

### Full source (copy this file as-is)

```js
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

if (!API_KEY) {
  console.error("Error: DEEPSEEK_API_KEY environment variable is missing.");
  process.exit(1);
}

const SYSTEM_PROMPT = `You are an editorial assistant that adds diagrams to blog posts.

TASK: Insert EXACTLY ONE markdown code block labeled "napkin" into the provided blog post, at the single best location.

RULES:
1. Find the most visually diagrammable concept in the post (a process, cycle, hierarchy, comparison, or step-by-step list).
2. Insert a code block like this immediately after the paragraph or list that describes it:

\`\`\`napkin
<diagram content here>
\`\`\`

3. Format the diagram content based on the concept:
   - Step-by-step process -> "Create a flowchart:\nStep 1 -> Step 2 -> Step 3"
   - Repeating cycle -> "Create a circular flowchart:\nStage 1 -> Stage 2 -> Stage 3 -> Stage 1"
   - Categories/hierarchy -> "Create a mind map:\n- Core\n  - Category A\n  - Category B"

4. CRITICAL: You MUST output the COMPLETE original markdown file with the napkin block inserted. Inserting the block is your ONLY change. Do not modify, delete, or rewrite any existing text or frontmatter.
5. Output ONLY the raw markdown. Do NOT wrap your entire response in a markdown code fence.

If you cannot find a good spot, still choose the best available paragraph and insert the block there. Returning the input unchanged is a failure.`;

async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  if (content.includes('```napkin')) {
    console.log(`Skipping ${path.basename(filePath)} (already has a napkin block)`);
    return;
  }

  console.log(`Processing: ${path.basename(filePath)}...`);

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
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let newContent = data.choices[0].message.content;

    // Strip an outer ```markdown fence if the model wrapped the whole reply
    if (newContent.startsWith('```markdown\n') && newContent.endsWith('\n```')) {
      newContent = newContent.slice(12, -4);
    } else if (newContent.startsWith('```\n') && newContent.endsWith('\n```')) {
      newContent = newContent.slice(4, -4);
    }

    if (newContent.includes('```napkin')) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`Success: Napkin block added to ${path.basename(filePath)}`);
    } else {
      console.log(`Warning: No napkin block was generated for ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error(`Failed to process ${path.basename(filePath)}:`, error.message);
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
```

### Run
```bash
DEEPSEEK_API_KEY="sk-..." node scripts/insert-napkin-blocks.js
```

### Adapting the content directory
Change `BLOG_DIR` to point at the other project's content folder (e.g. `content/posts`, `src/content/blog`, etc.). The script only cares that the files are Markdown/MDX.

---

## 5. Component 3 — Napkin remark plugin (Astro)

File: `src/plugins/remark-napkin.mjs`

### Full source (copy this file as-is)

```js
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { visit } from 'unist-util-visit';

export function remarkNapkin(options = {}) {
  return async (tree) => {
    const nodesToProcess = [];

    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'napkin') {
        nodesToProcess.push({ node, index, parent });
      }
    });

    if (nodesToProcess.length === 0) return;

    for (const { node, index, parent } of nodesToProcess) {
      const text = node.value;
      const hash = crypto.createHash('md5').update(text).digest('hex').substring(0, 10);
      const filename = `napkin-${hash}.png`;
      const publicDir = path.join(process.cwd(), 'public', 'diagrams');
      const filepath = path.join(publicDir, filename);

      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Resolve the key from an explicit option, then common env var names.
      const keySources = ['NAPKIN_API_TOKEN', 'NAPKIN_API_KEY', 'NAPKIN_KEY', 'VITE_NAPKIN_API_KEY'];
      let apiKey = options.apiKey;
      if (!apiKey) {
        for (const name of keySources) {
          const val = process.env[name];
          if (val && val.trim()) { apiKey = val; break; }
        }
      }

      if (!fs.existsSync(filepath)) {
        if (!apiKey) {
          console.warn(`[Napkin] Missing Napkin API key. Skipping diagram generation for hash ${hash}.`);
          parent.children[index] = {
            type: 'html',
            value: `<div class="p-6 my-6 text-center"><strong>Napkin Diagram Placeholder</strong><br/><span>API Key not found in build environment.</span></div>`
          };
          continue;
        }

        try {
          // STEP 1: Create the visual request
          const createResponse = await fetch('https://api.napkin.ai/v1/visual', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              content: text,      // <-- field is "content", NOT "text"
              style: 'vibrant',   // built-in style; see https://api.napkin.ai/docs/styles
              format: 'png',      // png | svg | ppt
              language: 'en'      // BCP 47 tag
            })
          });

          if (!createResponse.ok) {
            const errText = await createResponse.text().catch(() => '');
            throw new Error(`Napkin create error: ${createResponse.status} - ${errText}`);
          }

          const createData = await createResponse.json();
          const requestId = createData.id;
          if (!requestId) throw new Error("No request ID returned from Napkin API");

          // STEP 2: Poll until complete (async workflow)
          let isComplete = false;
          let fileUrl = null;
          let attempts = 0;
          const maxAttempts = 30; // ~60s at 2s intervals

          while (!isComplete && attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 2000));
            attempts++;
            const statusResponse = await fetch(`https://api.napkin.ai/v1/visual/${requestId}/status`, {
              headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (!statusResponse.ok) {
              const errText = await statusResponse.text().catch(() => '');
              throw new Error(`Napkin status error: ${statusResponse.status} - ${errText}`);
            }
            const statusData = await statusResponse.json();
            if (statusData.status === 'completed') {
              isComplete = true;
              if (statusData.generated_files?.length) {
                fileUrl = statusData.generated_files[0].url;
              } else {
                throw new Error("Napkin completed but returned no files.");
              }
            } else if (statusData.status === 'failed') {
              throw new Error(`Napkin failed: ${statusData.error || 'Unknown error'}`);
            }
          }

          if (!isComplete) throw new Error("Napkin generation timed out after 60 seconds.");

          // STEP 3: Download the file (auth header still required)
          const fileResponse = await fetch(fileUrl, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          if (!fileResponse.ok) throw new Error(`Failed to download image: ${fileResponse.status}`);

          const imageBuffer = await fileResponse.arrayBuffer();
          fs.writeFileSync(filepath, Buffer.from(imageBuffer));
          console.log(`[Napkin] Saved diagram to ${filepath}`);
        } catch (error) {
          console.error(`[Napkin] Failed: ${error.message}`);
          // Render a visible error instead of silently swallowing it
          parent.children[index] = {
            type: 'html',
            value: `<div class="p-6 my-6 text-center text-red-800 bg-red-50"><strong>Napkin API Error</strong><br/><span>${error.message}</span></div>`
          };
          continue;
        }
      }

      // Replace the code block with a static <img>
      parent.children[index] = {
        type: 'html',
        value: `<img src="/diagrams/${filename}" alt="${text.replace(/"/g, '&quot;').replace(/\n/g, ' ')}" class="w-full h-auto rounded-3xl my-10" loading="lazy" />`
      };
    }
  };
}
```

### Dependencies
```bash
pnpm add -D unist-util-visit
```

### Wire it into `astro.config.mjs`

```js
import { remarkNapkin } from './src/plugins/remark-napkin.mjs';

export default defineConfig({
  // ...
  markdown: {
    processor: unified({
      remarkPlugins: [remarkReadingTime, [remarkNapkin, { apiKey: process.env.NAPKIN_API_KEY }]],
      rehypePlugins: [/* your existing rehype plugins */],
    }),
  },
  // ...
});
```

> ⚠️ Do **NOT** `import { loadEnv } from 'vite'` at the top of `astro.config.mjs`. Vite is bundled inside Astro and is not a resolvable top-level module on Cloudflare's build runner — it fails with `Cannot find module 'vite'`.

---

## 6. Critical gotchas (learned the hard way)

1. **Napkin is asynchronous, not a one-shot call.** You must `POST /v1/visual` → poll `GET /v1/visual/{id}/status` until `status === "completed"` → download from `generated_files[0].url`. A single POST expecting an image returns 404.
2. **The request body field is `content`, not `text`.** Using `text` returns `400 validation failed: content is required`.
3. **Generated file + status URLs expire after 30 minutes.** Always download and host locally (we save to `public/diagrams/`); never hotlink them.
4. **Downloads still need the `Authorization: Bearer` header.**
5. **Cloudflare Pages env vars** must be set under **Production** (not Preview) and require a fresh deploy to be injected. If the build sees "none", the var wasn't saved or was scoped to the wrong environment.
6. **DeepSeek key ≠ tracking id.** The tracking id is the account identifier, not the auth secret. Valid keys start with `sk-`.
7. **DeepSeek prompt must be forceful.** Overly cautious prompts ("don't change anything") make the model echo the input back unchanged. Include "Returning the input unchanged is a failure" and set temperature ~0.3.
8. **Napkin output is sensitive to input format.** Use `->` arrows for flowcharts, `Create a circular flowchart:` for cycles, indented bullets for mind maps. A plain numbered list produces a *list image*, not a diagram.
9. **Idempotency:** hash the block text for the filename and skip files that already have a ````napkin` block, so re-runs are safe.

---

## 7. Adapting to non-Astro projects

The Napkin API workflow is **pure HTTP + Node** and works anywhere. Only the remark-plugin/`.mdx`-parsing layer is Astro-specific.

- **Next.js / Payload / any Node backend:** copy the `STEP 1 → STEP 2 → STEP 3` fetch logic into a server-side script, API route, or build step. Replace the remark `visit(tree, 'code', ...)` discovery with whatever finds your content blocks (a content-collection hook, a build script scanning Markdown files, a CMS webhook, etc.).
- **Static site generators (Eleventy, Hugo, etc.):** run the DeepSeek script on the content dir, then run a standalone Node script that scans for ````napkin` blocks, calls the Napkin API, and emits `<img>` tags before the SSG builds.
- The **DeepSeek script** needs zero changes other than pointing `BLOG_DIR` at the target content folder.

---

## 8. Suggested rollout order for a new project

1. Install the **humanizer** skill (`npx skills add blader/humanizer -y`) and commit it.
2. Copy `scripts/insert-napkin-blocks.js`, set `BLOG_DIR` to the project's content folder.
3. Copy `src/plugins/remark-napkin.mjs` (or port the fetch logic for non-Astro).
4. Wire the plugin into the build config; `pnpm add -D unist-util-visit` (Astro only).
5. Set `NAPKIN_API_KEY` in the host's Production env vars.
6. Run the DeepSeek script locally, review `git diff`, commit, push.
7. Verify a couple of posts render diagrams; check build logs for any red error boxes.

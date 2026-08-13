import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { visit } from 'unist-util-visit';

export function remarkNapkin(options = {}) {
  return async (tree) => {
    const nodesToProcess = [];

    // Find all markdown code blocks labeled as "napkin"
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

      const allNapkinKeys = Object.keys(process.env).filter(k => k.toLowerCase().includes('napkin'));
      // Resolve the key from an explicit option first, then a list of env var names.
      // NAPKIN_API_TOKEN is the preferred name; NAPKIN_API_KEY/NAPKIN_KEY are kept for back-compat.
      const keySources = ['NAPKIN_API_TOKEN', 'NAPKIN_API_KEY', 'NAPKIN_KEY', 'VITE_NAPKIN_API_KEY'];
      let apiKey = options.apiKey;
      let apiKeySource = apiKey ? 'options.apiKey' : null;
      if (!apiKey) {
        for (const name of keySources) {
          const val = process.env[name];
          if (val && val.trim()) {
            apiKey = val;
            apiKeySource = name;
            break;
          }
        }
      }

      // If the image doesn't exist locally, we hit the API
      if (!fs.existsSync(filepath)) {
        if (!apiKey) {
          // Report which napkin-related vars exist and whether each is set or empty,
          // so the build-time vs runtime scope problem is easy to diagnose.
          const keyStatus = allNapkinKeys.length
            ? allNapkinKeys.map(k => `${k}=${process.env[k] ? 'set' : 'empty'}`).join(', ')
            : 'none';
          console.warn(`[Napkin] Missing Napkin API key. Skipping diagram generation for hash ${hash}. Found keys: ${keyStatus}`);
          // Render a placeholder warning block in development if the key is missing
          parent.children[index] = {
            type: 'html',
            value: `<div class="p-6 bg-gaia-paper border border-gaia-border rounded-xl my-6 text-center text-gaia-soil font-sans"><strong>Napkin Diagram Placeholder</strong><br/><span class="text-sm">API Key not found in build environment. (Found related keys: ${keyStatus})</span></div>`
          };
          continue;
        }

        // Log the resolved source name and key length only; never log the secret value.
        console.log(`[Napkin] Generating diagram for block (key from ${apiKeySource}, length ${apiKey.length})...`);
        
        try {
          // Note: If the Napkin API endpoint or payload structure is different, it will throw here.
          const response = await fetch('https://api.napkin.ai/v1/diagrams', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              text: text,
              style: 'mindmap',
              // Force GaiaVerity brand colors onto the diagram
              theme: {
                background: "#f7f5f0",
                text: "#23312b",
                accent: "#c98633"
              }
            })
          });

          if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`Napkin API error: ${response.status} ${response.statusText} - ${errText}`);
          }

          const imageBuffer = await response.arrayBuffer();
          fs.writeFileSync(filepath, Buffer.from(imageBuffer));
          console.log(`[Napkin] Successfully saved diagram to ${filepath}`);
        } catch (error) {
          console.error(`[Napkin] Failed to generate diagram: ${error.message}`);
          parent.children[index] = {
            type: 'html',
            value: `<div class="p-6 bg-red-50 border border-red-200 rounded-xl my-6 text-center text-red-800 font-sans"><strong>Napkin API Error</strong><br/><span class="text-sm">${error.message}</span></div>`
          };
          continue;
        }
      }

      // Replace the Markdown code block with standard HTML pointing to the static image
      parent.children[index] = {
        type: 'html',
        value: `<img src="/diagrams/${filename}" alt="${text.replace(/"/g, '&quot;').replace(/\n/g, ' ')}" class="w-full h-auto rounded-3xl my-10" style="border: 1px solid rgba(128,190,164,0.5);" loading="lazy" />`
      };
    }
  };
}
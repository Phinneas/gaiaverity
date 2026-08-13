import fs from 'fs';
import path from 'path';

// Run with: DEEPSEEK_API_KEY=your_key_here node scripts/insert-napkin-blocks.js

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

if (!API_KEY) {
  console.error("Error: DEEPSEEK_API_KEY environment variable is missing.");
  process.exit(1);
}

const SYSTEM_PROMPT = `You are an expert editorial assistant. Your task is to analyze a Markdown blog post and insert exactly ONE Napkin.ai diagram code block into the text.

Rules for placement:
1. Identify all bulleted lists or step-by-step processes in the post.
2. Ignore the very first list (to avoid placing the diagram too close to the header) and the very last list (to avoid the footer).
3. From the remaining candidates, select the one that describes a highly visual process—such as a cycle, hierarchy, flowchart, or mind map.
4. Insert a Napkin diagram code block directly above or below this chosen list. 

Rules for Diagram Formatting:
Napkin.ai generates different diagrams based on how you format the text. You must CHOOSE the best format for the concept you are highlighting.

Option A: For step-by-step processes, timelines, or flowcharts, use arrows:
\`\`\`napkin
Create a flowchart:
Step 1 -> Step 2 -> Step 3 -> Step 4
\`\`\`

Option B: For repeating cycles, specify a circular flowchart and use arrows:
\`\`\`napkin
Create a circular flowchart:
Stage 1 -> Stage 2 -> Stage 3 -> Stage 1
\`\`\`

Option C: For categorizations, hierarchies, or breaking a core concept into parts, use indented bullet points:
\`\`\`napkin
Create a mind map:
- Core Concept
  - Category A
    - Detail 1
    - Detail 2
  - Category B
    - Detail 3
\`\`\`

Rules for output:
- Choose the ONE format above that best fits the text you selected.
- Do NOT change, rewrite, or delete ANY other text in the file.
- Do NOT alter the frontmatter.
- Return the FULL, exact markdown file with just the napkin block added in the optimal spot.
- Output ONLY the raw markdown content. Do not wrap your response in an overarching markdown code block.`;

async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
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
        temperature: 0.1 // Low temperature for high fidelity/consistency
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let newContent = data.choices[0].message.content;

    // Clean up if the model wrapped the whole response in ```markdown
    if (newContent.startsWith('```markdown\n') && newContent.endsWith('\n```')) {
      newContent = newContent.slice(12, -4);
    } else if (newContent.startsWith('```\n') && newContent.endsWith('\n```')) {
      newContent = newContent.slice(4, -4);
    }

    // Only save if the napkin block was actually added
    if (newContent.includes('```napkin')) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✅ Success: Napkin block added to ${path.basename(filePath)}`);
    } else {
      console.log(`⚠️ Warning: No napkin block was generated for ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Failed to process ${path.basename(filePath)}:`, error.message);
  }
}

async function main() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
  
  console.log(`Found ${files.length} MDX files to process.`);
  
  for (const file of files) {
    await processFile(path.join(BLOG_DIR, file));
    // Add a small delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("Finished processing all files!");
}

main();
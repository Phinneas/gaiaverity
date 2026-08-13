import fs from 'fs';
import path from 'path';

// Run with: DEEPSEEK_API_KEY=your_key_here node scripts/insert-napkin-blocks.js

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

  // Skip files that already have a napkin block to avoid duplicates on re-runs
  if (content.includes('```napkin')) {
    console.log(`⏭️  Skipping ${path.basename(filePath)} (already has a napkin block)`);
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
        temperature: 0.3 // Slightly higher temp so the model actually inserts a block
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
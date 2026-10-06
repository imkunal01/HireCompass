const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const wb = xlsx.readFile(path.join(__dirname, '../Capgemini_DSA_Problems_New.xlsx'));
const sheet = wb.Sheets[wb.SheetNames[0]];
const excelRows = xlsx.utils.sheet_to_json(sheet);

console.log(`Processing ${excelRows.length} rows for sheet-templates.ts...`);

// Group by Topic
const topicsMap = {};

for (const row of excelRows) {
  const topic = row['Topic'] || 'DSA';
  if (!topicsMap[topic]) {
    topicsMap[topic] = [];
  }

  const rawDiff = (row['Difficulty'] || 'Medium').toLowerCase();
  const difficulty = rawDiff === 'easy' ? 'Easy' : rawDiff === 'hard' ? 'Hard' : 'Medium';
  const platform = row['Platform'] ? (
    row['Platform'].toLowerCase().includes('leetcode') ? 'LeetCode' :
    row['Platform'].toLowerCase().includes('geeks') ? 'GFG' :
    row['Platform'].toLowerCase().includes('chef') ? 'CodeChef' :
    row['Platform'].toLowerCase().includes('forces') ? 'Codeforces' :
    row['Platform'].toLowerCase().includes('hackerrank') ? 'HackerRank' :
    row['Platform'].toLowerCase().includes('interviewbit') ? 'InterviewBit' : 'Other'
  ) : 'Other';

  const tags = (row['Tags'] || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  topicsMap[topic].push({
    title: row['Title'],
    difficulty,
    platform,
    problemLink: row['Problem Link'] || '',
    articleLink: row['Article Link'] || '',
    youtubeLink: row['YouTube'] || '',
    tags
  });
}

const templateCode = `import { Difficulty, Platform, SheetCategory } from "@/types/sheet"

export interface TemplateItemDefinition {
  title: string
  difficulty: Difficulty
  platform: Platform
  problemLink?: string
  articleLink?: string
  youtubeLink?: string
  tags?: string[]
}

export interface TemplateDefinition {
  title: string
  category: SheetCategory
  description: string
  topics: Record<string, TemplateItemDefinition[]>
}

export const BUILTIN_TEMPLATES: Record<string, TemplateDefinition> = {
  "capgemini-dsa": {
    title: "Capgemini DSA Problems",
    category: "DSA",
    description: "Complete 150-problem Capgemini DSA assessment syllabus spanning Arrays, Strings, Sliding Window, DP, Trees, and Graphs.",
    topics: ${JSON.stringify(topicsMap, null, 2)}
  }
}
`;

fs.writeFileSync(path.join(__dirname, '../lib/sheet-templates.ts'), templateCode, 'utf-8');
console.log("Successfully wrote lib/sheet-templates.ts with Capgemini 150 sheet!");

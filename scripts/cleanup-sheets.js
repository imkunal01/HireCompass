const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/MONGODB_URI=(.+)/);
const uri = match[1].trim();
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const sheetsCol = db.collection('sheets');
  const itemsCol = db.collection('sheet_items');

  // 1. Delete all existing template sheets
  const existingTemplates = await sheetsCol.find({ isTemplate: true }).toArray();
  for (const t of existingTemplates) {
    const deleted = await itemsCol.deleteMany({ sheet: t._id });
    await sheetsCol.deleteOne({ _id: t._id });
    console.log(`Removed template "${t.title}" (${t._id}) and ${deleted.deletedCount} items.`);
  }

  // 2. Read Capgemini_DSA_Problems_New.xlsx
  const wb = xlsx.readFile('Capgemini_DSA_Problems_New.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const excelRows = xlsx.utils.sheet_to_json(sheet);
  console.log(`Total Excel rows: ${excelRows.length}`);

  const topicsMap = {};
  for (const row of excelRows) {
    const topic = (row['Topic'] || 'General DSA').trim();
    const title = (row['Title'] || '').trim();
    if (!title) continue;

    const rawDiff = (row['Difficulty'] || 'Medium').trim();
    const difficulty = rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1).toLowerCase();
    const platform = (row['Platform'] || 'LeetCode').trim();
    const problemLink = (row['Problem Link'] || '').trim();
    const tags = (row['Tags'] || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (!topicsMap[topic]) topicsMap[topic] = [];
    topicsMap[topic].push({
      title,
      difficulty: difficulty === 'Hard' ? 'Hard' : difficulty === 'Easy' ? 'Easy' : 'Medium',
      platform: platform === 'LeetCode' || platform === 'GeeksforGeeks' || platform === 'HackerRank' || platform === 'CodeStudio' ? platform : 'Other',
      problemLink,
      tags: ['capgemini', ...tags]
    });
  }

  const topicNames = Object.keys(topicsMap);
  const now = new Date();
  const sheetDoc = {
    owner: null,
    isTemplate: true,
    templateKey: 'capgemini-dsa',
    clonedFrom: null,
    title: 'Capgemini DSA Problems',
    description: 'Complete 150-problem Capgemini DSA assessment syllabus spanning Arrays, Strings, Sliding Window, DP, Trees, and Graphs.',
    category: 'DSA',
    topics: topicNames.map((name, i) => ({ name, order: i })),
    itemCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const res = await sheetsCol.insertOne(sheetDoc);
  const sheetId = res.insertedId;

  const itemsToInsert = [];
  for (const topicName of topicNames) {
    const topicItems = topicsMap[topicName] || [];
    topicItems.forEach((it, order) => {
      itemsToInsert.push({
        sheet: sheetId,
        topic: topicName,
        title: it.title,
        difficulty: it.difficulty,
        platform: it.platform,
        problemLink: it.problemLink,
        articleLink: '',
        youtubeLink: '',
        tags: it.tags,
        order,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  if (itemsToInsert.length > 0) {
    await itemsCol.insertMany(itemsToInsert, { ordered: false });
    await sheetsCol.updateOne({ _id: sheetId }, { $set: { itemCount: itemsToInsert.length } });
  }

  console.log(`Successfully seeded Capgemini DSA template with ${itemsToInsert.length} problems across ${topicNames.length} topics!`);

  // Final check
  const finalSheets = await sheetsCol.find({}).toArray();
  console.log('\n--- Final Sheets in DB ---');
  for (const s of finalSheets) {
    console.log(`- [${s.isTemplate ? 'TEMPLATE' : 'USER'}] "${s.title}" (key: ${s.templateKey || 'none'}, items: ${s.itemCount})`);
  }

  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

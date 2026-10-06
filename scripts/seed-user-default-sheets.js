const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/MONGODB_URI=(.+)/);
const uri = match[1].trim();
const { MongoClient, ObjectId } = require('mongodb');
const xlsx = require('xlsx');

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const usersCol = db.collection('users');
  const sheetsCol = db.collection('sheets');
  const itemsCol = db.collection('sheet_items');

  // Load problems from Capgemini_DSA_Problems_New.xlsx
  const wb = xlsx.readFile('Capgemini_DSA_Problems_New.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const excelRows = xlsx.utils.sheet_to_json(sheet);

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

  // 1. For user kunaldhangar184@gmail.com, normalize their existing 150-problem sheet title if it had Formatted (3)
  const kunal = await usersCol.findOne({ email: 'kunaldhangar184@gmail.com' });
  if (kunal) {
    const existingFormatted = await sheetsCol.findOne({
      $and: [
        { $or: [{ owner: kunal._id }, { owner: kunal._id.toString() }] },
        { title: /Capgemini DSA Problems/i }
      ]
    });
    if (existingFormatted) {
      await sheetsCol.updateOne(
        { _id: existingFormatted._id },
        { $set: { title: 'Capgemini DSA Problems', templateKey: 'capgemini-dsa' } }
      );
      console.log(`Normalized existing sheet title to "Capgemini DSA Problems" for ${kunal.email}`);
    }
  }

  // 2. For all users in the database, ensure they have Capgemini DSA Problems
  const allUsers = await usersCol.find({}).toArray();
  console.log(`Checking ${allUsers.length} users in database...`);

  for (const u of allUsers) {
    const uId = u._id;
    const uIdStr = u._id.toString();

    const existing = await sheetsCol.findOne({
      isTemplate: false,
      $and: [
        { $or: [{ owner: uId }, { owner: uIdStr }] },
        {
          $or: [
            { templateKey: 'capgemini-dsa' },
            { title: 'Capgemini DSA Problems' }
          ]
        }
      ]
    });

    if (existing) {
      console.log(`User ${u.email} already has "${existing.title}" (${existing._id})`);
      continue;
    }

    const now = new Date();
    const newSheet = {
      owner: uId,
      isTemplate: false,
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

    const res = await sheetsCol.insertOne(newSheet);
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

    console.log(`Provisioned default Capgemini DSA sheet (150 problems) for user ${u.email} (${sheetId})`);
  }

  console.log('\n--- All Non-Template Sheets Now in DB ---');
  const currentSheets = await sheetsCol.find({ isTemplate: false }).toArray();
  for (const s of currentSheets) {
    console.log(`- [User: ${s.owner}] "${s.title}" (${s.itemCount} items)`);
  }

  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

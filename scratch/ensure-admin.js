const fs = require('fs');
const { MongoClient } = require('mongodb');

const env = fs.readFileSync('.env', 'utf8');
const uri = env.match(/MONGODB_URI=([^\r\n]+)/)[1].trim();

async function update() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const emails = [
    'kunaldhangar184@gmail.com',
    'kunal@gmail.com',
    'demo@jobshunt.com',
    'kunal12@gmail.com',
    'kun@gmail.com',
    'kunalsharmakunu09@gmail.com',
    'kuchhnahihe184@gmail.com'
  ];
  const res = await db.collection('users').updateMany(
    { email: { $in: emails } },
    { $set: { role: 'admin', updatedAt: new Date() } }
  );
  console.log('Updated admin roles count:', res.modifiedCount, 'matched:', res.matchedCount);
  await client.close();
}
update().catch(console.error);

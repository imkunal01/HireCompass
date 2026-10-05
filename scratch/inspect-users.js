const fs = require('fs');
const { MongoClient } = require('mongodb');

const env = fs.readFileSync('.env', 'utf8');
const uri = env.match(/MONGODB_URI=([^\r\n]+)/)[1].trim();

async function inspect() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const users = await db.collection('users').find({}, { projection: { name: 1, email: 1, role: 1 } }).toArray();
  console.log('ALL USERS:');
  console.log(JSON.stringify(users, null, 2));
  await client.close();
}
inspect().catch(console.error);

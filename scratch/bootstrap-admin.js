const fs = require('fs');
const { MongoClient } = require('mongodb');

const env = fs.readFileSync('.env', 'utf8');
const mongoMatch = env.match(/MONGODB_URI=([^\r\n]+)/);
const adminMatch = env.match(/ADMIN_EMAIL=([^\r\n]+)/);

if (!mongoMatch) {
  console.error("MONGODB_URI not found in .env");
  process.exit(1);
}

const uri = mongoMatch[1].trim();
const adminEmail = (adminMatch ? adminMatch[1].trim() : 'kunaldhangar184@gmail.com').toLowerCase();

async function bootstrap() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');

    const result = await users.updateOne(
      { email: adminEmail },
      { $set: { role: 'admin', updatedAt: new Date() } }
    );

    console.log(`Updated user ${adminEmail}: matched=${result.matchedCount}, modified=${result.modifiedCount}`);

    const user = await users.findOne({ email: adminEmail }, { projection: { passwordHash: 0 } });
    console.log("Current user record:", JSON.stringify(user, null, 2));
  } catch (err) {
    console.error("Bootstrap error:", err);
  } finally {
    await client.close();
  }
}

bootstrap();

const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');
const { SignJWT, jwtVerify } = require('jose');

const env = fs.readFileSync('.env', 'utf8');
const mongoMatch = env.match(/MONGODB_URI=([^\r\n]+)/);
const secretMatch = env.match(/JWT_SECRET=([^\r\n]+)/);
const adminMatch = env.match(/ADMIN_EMAIL=([^\r\n]+)/);

const uri = mongoMatch[1].trim();
const secret = new TextEncoder().encode(secretMatch[1].trim());
const adminEmail = adminMatch[1].trim().toLowerCase();

async function runTests() {
  console.log("=== HIRECOMPASS ADMIN WORKFLOW VERIFICATION ===");
  console.log("1. Admin Email configured in .env:", adminEmail);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  // Test 1: Verify user in MongoDB
  const user = await db.collection('users').findOne({ email: adminEmail });
  if (!user) {
    console.error("FAIL: Admin user not found in DB!");
    process.exit(1);
  }
  console.log("2. DB User lookup:", {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    hasRoleAdmin: user.role === 'admin'
  });
  if (user.role !== 'admin') {
    console.error("FAIL: User role is not 'admin'!");
    process.exit(1);
  }

  // Test 2: Verify JWT signing and decoding
  const token = await new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user._id.toString())
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);

  const { payload } = await jwtVerify(token, secret);
  console.log("3. JWT Verification:", {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  });

  if (payload.role !== 'admin') {
    console.error("FAIL: Decoded JWT role is not 'admin'!");
    process.exit(1);
  }

  // Test 3: Check statistics that the admin dashboard relies on
  const [totalUsers, totalAdmins, totalOpportunities, totalResumes] = await Promise.all([
    db.collection('users').countDocuments(),
    db.collection('users').countDocuments({ role: 'admin' }),
    db.collection('opportunities').countDocuments(),
    db.collection('cv_documents').countDocuments(),
  ]);

  console.log("4. Admin Dashboard Metrics:", {
    totalUsers,
    totalAdmins,
    totalOpportunities,
    totalResumes,
  });

  if (totalAdmins < 1) {
    console.error("FAIL: totalAdmins should be at least 1!");
    process.exit(1);
  }

  console.log("=== ALL ADMIN VERIFICATION CHECKS PASSED ===");
  await client.close();
}

runTests().catch(console.error);

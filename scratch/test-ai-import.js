const fs = require('fs');
const { SignJWT } = require('jose');

const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/JWT_SECRET=([^\r\n]+)/);
const secret = new TextEncoder().encode(match[1].trim());

async function test() {
  const token = await new SignJWT({ name: 'Kunal', email: 'test@hirecompass.com', role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('test-user-id')
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);

  const rawJD = "Senior Full Stack Engineer\nAcme AI Corp - San Francisco, CA (Remote)\nFull-time · $160,000 - $190,000 / year\n\nAbout the Role:\nWe are seeking an experienced Senior Full Stack Engineer to scale our real-time collaboration engine.\nYou will architect Next.js frontend applications, optimize PostgreSQL and MongoDB databases, and build Python microservices.\n\nRequirements:\n- 5+ years building full-stack applications with React, Next.js, and TypeScript\n- Strong proficiency in Node.js, Python, and Docker\n- Experience with cloud platforms (AWS / GCP) and distributed messaging (Kafka/RabbitMQ)\n- Excellent communication skills for async remote culture\n\nBenefits:\n- 401(k) matching, comprehensive health insurance, unlimited PTO.\nApply before October 31, 2026.";

  console.log("Sending raw JD dump to /api/extension/import...");
  const res = await fetch('http://localhost:3000/api/extension/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ rawText: rawJD })
  });

  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('Extracted & Saved Job:', JSON.stringify(data, null, 2));
}

test();

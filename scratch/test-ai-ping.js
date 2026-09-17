const fs = require('fs');
const Groq = require('groq-sdk');

const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/GROQ_API_KEY=([^\r\n]+)/);
const modelMatch = env.match(/GROQ_MODEL=([^\r\n]+)/);

const apiKey = keyMatch[1].trim();
const model = modelMatch ? modelMatch[1].trim() : 'openai/gpt-oss-120b';

async function testGroq() {
  console.log("Testing Groq API connection with model:", model);
  const groq = new Groq({ apiKey });

  const start = Date.now();
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are a health-check responder." },
      { role: "user", content: "Respond with the single word: OK" },
    ],
    max_tokens: 10,
    temperature: 0.1,
  });
  const latencyMs = Date.now() - start;
  const reply = completion.choices?.[0]?.message?.content?.trim();

  console.log("Response:", reply);
  console.log(`Latency: ${latencyMs}ms`);
  console.log("Status: AI service is healthy!");
}

testGroq().catch(console.error);

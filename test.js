const fetch = require('node-fetch'); // If needed, or use built-in fetch if node >= 18
const apiKey = process.env.VITE_GEMINI_API_KEY || "";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

async function test() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: "Hello" }] },
        contents: [{ role: "user", parts: [{ text: "Hi" }] }]
      })
    });
    const data = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (e) {
    console.error(e);
  }
}
test();

const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AQ.Ab8RN6Jl1F50w48zgFKJE3NQbjFGmVsj80uRr-YbZXJPgLXyGA";

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ text: "Hello" }] }]
  })
}).then(res => res.json()).then(console.log).catch(console.error);

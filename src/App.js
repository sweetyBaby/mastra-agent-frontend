import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  const handleSend = async () => {
    const query = `
      query {
        chat(message: "${message}")
      }
    `;

    const res = await fetch("https://royal-hat-e15a.tongyao5186.workers.dev/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const result = await res.json();
    setReply(result.data.chat);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>DeepSeek Chat</h2>
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={handleSend}>发送</button>
      <p>回复：{reply}</p>
    </div>
  );
}

export default App;

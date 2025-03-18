// app/components/Chatbot.tsx
import { useState } from 'react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface ChatbotProps {
  confirmedSubject: string;
  avgHeartRate: number;
  avgHRV: number;
}

export default function Chatbot() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: ChatMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    setLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
        })
      });

      const data = await response.json();
      if (data.success) {
        const botMessage: ChatMessage = { sender: 'bot', text: data.reply };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender === 'user' ? 'You' : 'Bot'}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
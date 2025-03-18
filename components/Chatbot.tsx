// components/Chatbot.tsx
'use client';
import { useState } from 'react';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface ChatbotProps {
  heartRate: number;
  hrv: number;
  signalQuality: string;
}

export default function Chatbot({ 
  heartRate, 
  hrv, 
  signalQuality 
}: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');

    try {
      const requestBody = {
        message: input,
        heartRate,
        hrv,
        signalQuality,
      };

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: 'An error occurred. Please try again later.' },
      ]);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Chat with HeartLen Bot</h2>
      
      {/* Chat History */}
      <div className="mb-4 max-h-60 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
          </div>
        ))}
      </div>

      {/* Input Field and Send Button */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-grow p-2 border border-gray-300 rounded-lg"
        />
        <button 
          onClick={sendMessage}
          className="p-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-all duration-300"
        >
          Send
        </button>
      </div>
    </div>
  );
}
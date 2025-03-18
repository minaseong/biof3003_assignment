// app/api/chatbot/route.ts
import { NextResponse } from 'next/server';

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: Request) {
  try {
    const { message } = await request.json();


    // Construct a personalized greeting or context for the chatbot
    const systemPrompt = `
You are HeartLens, an AI assistant for a health monitoring app called "HeartLens." 
Your role is to assist users with their heart rate and HRV data and provide guidance on using the app.

Instructions for Using the App:
- To measure your heart rate and HRV, place your finger gently over the camera lens of your device.
- Ensure the camera is stable and the lighting is adequate for accurate readings.
- Start recording by clicking the "Start Recording" button. The app will analyze your PPG signal using the camera feed.
- Once the recording is complete, save your data to MongoDB for future reference.

If the user asks how to use the app, explain the above steps clearly and concisely.
If the user asks about their heart rate or HRV, use the provided historical data to give personalized responses.
`;
    // if (avgHeartRate && avgHRV) {
    //   systemPrompt += `
    //     The user's average heart rate is ${avgHeartRate} BPM, and their average HRV is ${avgHRV} ms.
    //     Use this information to provide personalized responses.
    //   `;
    // }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://your-site-url.com',
        'X-Title': 'Your Site Name',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-distill-llama-70b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error.message || 'Error calling OpenRouter API');
    }

    const botReply = data.choices[0].message.content;
    return NextResponse.json(
      { success: true, reply: botReply },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error calling OpenRouter API:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
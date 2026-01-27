import { GoogleGenerativeAI } from "@google/generative-ai";

// THIS IS A STUB FOR THE FUTURE AI INTEGRATION
// You will plug your Gemini API Key here later.

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || ""; 

export const AiService = {
  
  async generateMissions(userInterests: string[]) {
    if (!API_KEY) {
      console.warn("AI Service: No API Key provided.");
      return [];
    }
    
    // Future logic: Call Gemini to create personalized missions
    // const genAI = new GoogleGenerativeAI(API_KEY);
    // const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    // ...
    
    return [
      { title: "AI Generated: Coffee Run", desc: "Based on your love for espresso." }
    ];
  }
};

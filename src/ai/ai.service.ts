import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async analyzeMatches(matches: any[]) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    Analyze these football matches and provide safe betting recommendations:
    ${JSON.stringify(matches, null, 2)}
    
    Focus on:
    1. Ultra-safe markets (1.01-1.04 odds)
    2. Recent form analysis
    3. Head-to-head records
    4. Key player availability
    5. Home advantage factors
    
    Return JSON format with your analysis.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      return JSON.parse(text);
    } catch (error) {
      return { analysis: text };
    }
  }
}

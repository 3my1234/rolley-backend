import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => {
  // Priority: environment variable > default HTTP internal network > fallback HTTPS
  const envUrl = process.env.FOOTBALL_AI_URL;
  const defaultInternalUrl = 'http://f4c4o880s8go0co48kkwsw00:8000';
  const fallbackPublicUrl = 'https://f4c4o880s8go0co48kkwsw00.useguidr.com';
  
  // Use env var if set, otherwise default to internal network (for Docker)
  const footballAiUrl = envUrl || defaultInternalUrl;
  
  // Debug logging
  console.log('🔍 AI Config Debug:');
  console.log('  - FOOTBALL_AI_URL env var:', envUrl || '(not set)');
  console.log('  - Selected URL:', footballAiUrl);
  
  return {
    geminiApiKey: process.env.GEMINI_API_KEY,
    footballAiUrl,
  };
});

import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => {
  // Use environment variable if set, otherwise use public HTTPS URL (proven to work)
  // Internal Docker network hostname doesn't resolve - using public URL works
  const envUrl = process.env.FOOTBALL_AI_URL;
  const publicUrl = 'https://f4c4o880s8go0co48kkwsw00.useguidr.com';
  
  const footballAiUrl = envUrl || publicUrl;
  
  return {
    geminiApiKey: process.env.GEMINI_API_KEY,
    footballAiUrl,
  };
});

import { registerAs } from '@nestjs/config';

export default registerAs('n8n', () => ({
  apiKey: process.env.N8N_API_KEY,
  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
}));

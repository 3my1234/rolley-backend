import { registerAs } from '@nestjs/config';

export default registerAs('api', () => ({
  footballKey: process.env.API_FOOTBALL_KEY,
}));

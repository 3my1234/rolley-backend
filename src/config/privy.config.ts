import { registerAs } from '@nestjs/config';

export default registerAs('privy', () => ({
  appId: process.env.PRIVY_APP_ID,
  appSecret: process.env.PRIVY_APP_SECRET,
}));

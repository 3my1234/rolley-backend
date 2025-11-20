import { registerAs } from '@nestjs/config';

export default registerAs('payment', () => ({
  flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
  flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY,
  flutterwaveEncryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
}));

import { Transform } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  IsPositive,
} from 'class-validator';

export class UsdtWebhookDto {
  @IsString()
  txHash: string;

  @IsString()
  toAddress: string;

  @IsString()
  fromAddress: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value),
  )
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  network: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null
      ? undefined
      : typeof value === 'string'
        ? parseInt(value, 10)
        : Number(value),
  )
  @IsNumber()
  confirmations?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}


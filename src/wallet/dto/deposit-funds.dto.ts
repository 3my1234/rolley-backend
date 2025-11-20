import { IsString, IsNumber, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositFundsDto {
  @ApiProperty({ description: 'Deposit amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency', enum: ['USD', 'USDT'] })
  @IsIn(['USD', 'USDT'])
  currency: string;

  @ApiProperty({ description: 'Payment method', enum: ['flutterwave', 'privy'] })
  @IsIn(['flutterwave', 'privy'])
  paymentMethod: string;
}

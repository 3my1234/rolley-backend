import { IsString, IsNumber, IsIn, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawFundsDto {
  @ApiProperty({ description: 'Withdrawal amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency', enum: ['USD', 'USDT'] })
  @IsIn(['USD', 'USDT'])
  currency: string;

  @ApiProperty({ description: 'Withdrawal details' })
  @IsObject()
  withdrawalDetails: any;
}

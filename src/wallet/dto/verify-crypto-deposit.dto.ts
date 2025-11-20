import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCryptoDepositDto {
  @ApiProperty({ description: 'Transaction hash' })
  @IsString()
  transactionHash: string;

  @ApiProperty({ description: 'Amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Network', required: false })
  @IsOptional()
  @IsString()
  network?: string;
}

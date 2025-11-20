import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Privy user ID' })
  @IsString()
  privyId: string;

  @ApiProperty({ description: 'User email', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Wallet address', required: false })
  @IsOptional()
  @IsString()
  walletAddress?: string;

  @ApiProperty({ description: 'Referrer user ID', required: false })
  @IsOptional()
  @IsString()
  referredBy?: string;
}

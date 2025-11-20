import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncUserDto {
  @ApiProperty({ 
    description: 'Referral code for user registration',
    required: false,
    example: 'ABC123XYZ'
  })
  @IsOptional()
  @IsString()
  referralCode?: string;
}
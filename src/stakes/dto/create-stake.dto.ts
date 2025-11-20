import { IsNumber, IsString, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStakeDto {
  @ApiProperty({ 
    description: 'Stake amount',
    example: 100,
    enum: [0.25, 10, 100, 1000, 10000]
  })
  @IsNumber()
  @IsIn([0.25, 10, 100, 1000, 10000])
  amount: number;

  @ApiProperty({ 
    description: 'Currency (only ROL supported)',
    example: 'ROL',
    enum: ['ROL']
  })
  @IsString()
  @IsIn(['ROL'])
  currency: string;

  @ApiProperty({ 
    description: 'Staking period',
    example: 'THIRTY_DAYS',
    enum: ['THIRTY_DAYS', 'SIXTY_DAYS', 'ONE_EIGHTY_DAYS', 'THREE_SIXTY_FIVE_DAYS']
  })
  @IsString()
  @IsIn(['THIRTY_DAYS', 'SIXTY_DAYS', 'ONE_EIGHTY_DAYS', 'THREE_SIXTY_FIVE_DAYS'])
  period: string;
}

import { IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ParticipateStakeDto {
  @ApiProperty({ description: 'Stake ID' })
  @IsString()
  stakeId: string;

  @ApiProperty({ description: 'Daily event ID' })
  @IsString()
  dailyEventId: string;

  @ApiProperty({ description: 'Whether to participate in the event' })
  @IsBoolean()
  participate: boolean;
}

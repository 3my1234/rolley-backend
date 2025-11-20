import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConvertTokenDto {
  @ApiProperty({ 
    description: 'Amount of ROL tokens to convert',
    example: 1000,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  rolAmount: number;
}

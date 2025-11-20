import { IsNumber, Min, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TradeRolDto {
  @ApiProperty({ 
    description: 'Trade type: BUY (buy ROL) or SELL (sell ROL)',
    example: 'BUY'
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ 
    description: 'Currency to use for trade (USD or USDT)',
    example: 'USD'
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ 
    description: 'Amount - for BUY: USD/USDT amount, for SELL: ROL amount',
    example: 100,
    minimum: 0.01
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;
}


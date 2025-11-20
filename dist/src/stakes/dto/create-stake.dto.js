"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateStakeDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateStakeDto {
}
exports.CreateStakeDto = CreateStakeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Stake amount',
        example: 100,
        enum: [0.25, 10, 100, 1000, 10000]
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsIn)([0.25, 10, 100, 1000, 10000]),
    __metadata("design:type", Number)
], CreateStakeDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Currency (only ROL supported)',
        example: 'ROL',
        enum: ['ROL']
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['ROL']),
    __metadata("design:type", String)
], CreateStakeDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Staking period',
        example: 'THIRTY_DAYS',
        enum: ['THIRTY_DAYS', 'SIXTY_DAYS', 'ONE_EIGHTY_DAYS', 'THREE_SIXTY_FIVE_DAYS']
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['THIRTY_DAYS', 'SIXTY_DAYS', 'ONE_EIGHTY_DAYS', 'THREE_SIXTY_FIVE_DAYS']),
    __metadata("design:type", String)
], CreateStakeDto.prototype, "period", void 0);
//# sourceMappingURL=create-stake.dto.js.map
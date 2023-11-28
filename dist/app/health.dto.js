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
exports.HealthDTO = void 0;
const swagger_1 = require("@midwayjs/swagger");
const validate_1 = require("@midwayjs/validate");
class HealthDTO {
}
exports.HealthDTO = HealthDTO;
__decorate([
    (0, validate_1.Rule)(validate_1.RuleType.string().required()),
    (0, swagger_1.ApiProperty)({
        description: 'status',
        example: 'ok',
    }),
    __metadata("design:type", String)
], HealthDTO.prototype, "status", void 0);

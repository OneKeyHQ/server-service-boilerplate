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
exports.AppController = void 0;
const core_1 = require("@midwayjs/core");
const swagger_1 = require("@midwayjs/swagger");
const swagger_success_wrapper_1 = require("../utils/swagger-success-wrapper");
const health_dto_1 = require("./health.dto");
let AppController = class AppController {
    async check() {
        return 'ok';
    }
};
exports.AppController = AppController;
__decorate([
    (0, core_1.Get)('/health'),
    (0, swagger_1.ApiResponse)({
        type: (0, swagger_success_wrapper_1.SuccessWrapper)(health_dto_1.HealthDTO),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "check", null);
exports.AppController = AppController = __decorate([
    (0, core_1.Controller)('/'),
    (0, swagger_1.ApiTags)(['/'])
], AppController);

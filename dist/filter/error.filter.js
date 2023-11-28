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
exports.DefaultErrorFilter = void 0;
const core_1 = require("@midwayjs/core");
let DefaultErrorFilter = class DefaultErrorFilter {
    async catch(err, ctx) {
        var _a;
        this.logger.error(err);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const errcode = err.status || ((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) || 400;
        // 所有的未分类错误会到这里
        ctx.status = errcode;
        return {
            code: -1,
            message: err.message,
            data: null,
        };
    }
};
exports.DefaultErrorFilter = DefaultErrorFilter;
__decorate([
    (0, core_1.Logger)(),
    __metadata("design:type", Object)
], DefaultErrorFilter.prototype, "logger", void 0);
exports.DefaultErrorFilter = DefaultErrorFilter = __decorate([
    (0, core_1.Catch)()
], DefaultErrorFilter);

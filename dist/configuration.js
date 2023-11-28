"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceBaseConfiguration = void 0;
const core_1 = require("@midwayjs/core");
const DefaultConfig = __importStar(require("./config/config.default"));
const crossDomain = __importStar(require("@midwayjs/cross-domain"));
const i18n = __importStar(require("@midwayjs/i18n"));
const koa = __importStar(require("@midwayjs/koa"));
const mongoose = __importStar(require("@midwayjs/mongoose"));
const redis = __importStar(require("@midwayjs/redis"));
const swagger = __importStar(require("@midwayjs/swagger"));
const validate = __importStar(require("@midwayjs/validate"));
const response_wraper_1 = require("./middleware/response-wraper");
const error_filter_1 = require("./filter/error.filter");
const notfound_filter_1 = require("./filter/notfound.filter");
const register_model_1 = require("./utils/register-model");
let ServiceBaseConfiguration = class ServiceBaseConfiguration {
    async onReady(applicationContext) {
        this.app.useMiddleware([response_wraper_1.ResponseWraperMiddleware]);
        this.app.useFilter([error_filter_1.DefaultErrorFilter, notfound_filter_1.NotFoundFilter]);
        const connection = this.dataSourceManager.getDataSource('default');
        await (0, register_model_1.registerModel)(applicationContext, connection, this.app.getBaseDir());
    }
};
exports.ServiceBaseConfiguration = ServiceBaseConfiguration;
__decorate([
    (0, core_1.App)('koa'),
    __metadata("design:type", Object)
], ServiceBaseConfiguration.prototype, "app", void 0);
__decorate([
    (0, core_1.Config)('env'),
    __metadata("design:type", String)
], ServiceBaseConfiguration.prototype, "envConfig", void 0);
__decorate([
    (0, core_1.Config)('aws'),
    __metadata("design:type", Object)
], ServiceBaseConfiguration.prototype, "awsConfig", void 0);
__decorate([
    (0, core_1.Inject)(),
    __metadata("design:type", core_1.MidwayLoggerService)
], ServiceBaseConfiguration.prototype, "loggerService", void 0);
__decorate([
    (0, core_1.Inject)(),
    __metadata("design:type", mongoose.MongooseDataSourceManager)
], ServiceBaseConfiguration.prototype, "dataSourceManager", void 0);
exports.ServiceBaseConfiguration = ServiceBaseConfiguration = __decorate([
    (0, core_1.Configuration)({
        namespace: 'service-base',
        imports: [
            koa,
            validate,
            mongoose,
            i18n,
            redis,
            {
                component: crossDomain,
                enabledEnvironment: ['local'],
            },
            {
                component: swagger,
                enabledEnvironment: ['local'],
            },
        ],
        importConfigs: [
            {
                default: DefaultConfig,
            },
        ],
    })
], ServiceBaseConfiguration);

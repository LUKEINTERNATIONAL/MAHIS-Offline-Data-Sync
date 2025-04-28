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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DataInitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataInitService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payload_entity_1 = require("./payload.entity");
const app_authService_1 = require("./app.authService");
let DataInitService = DataInitService_1 = class DataInitService {
    constructor(httpService, authService, payloadRepository) {
        this.httpService = httpService;
        this.authService = authService;
        this.payloadRepository = payloadRepository;
        this.logger = new common_1.Logger(DataInitService_1.name);
    }
};
exports.DataInitService = DataInitService;
exports.DataInitService = DataInitService = DataInitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(payload_entity_1.Payload)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        app_authService_1.AuthService,
        typeorm_2.Repository])
], DataInitService);
//# sourceMappingURL=app.dataInitService.js.map
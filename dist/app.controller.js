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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = exports.PayloadDto = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
class PayloadDto {
}
exports.PayloadDto = PayloadDto;
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    async getHome() {
        return await this.appService.getHome();
    }
    async receivePayload(payload) {
        return await this.appService.processPayload(payload);
    }
    async getAllPatientIds() {
        return await this.appService.getAllPatientIds();
    }
    async getPatientPayload(patientId) {
        const payload = await this.appService.getPatientPayload(patientId);
        if (!payload) {
            throw new common_1.NotFoundException(`Payload not found for patient ID ${patientId}`);
        }
        return JSON.parse(payload.data);
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Header)('Content-Type', 'text/html'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getHome", null);
__decorate([
    (0, common_1.Post)('receive-payload'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PayloadDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "receivePayload", null);
__decorate([
    (0, common_1.Get)('patient-ids'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAllPatientIds", null);
__decorate([
    (0, common_1.Get)('patient/:patientId/payload'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPatientPayload", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map
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
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payload_entity_1 = require("./payload.entity");
const qrcode_util_1 = require("./utils/qrcode.util");
const html_responses_1 = require("./utils/htmlStr/html_responses");
const patient_record_utils_1 = require("./utils/patient_record_utils");
let AppService = class AppService {
    constructor(payloadRepository) {
        this.payloadRepository = payloadRepository;
    }
    async getHome() {
        const port = process.env.PORT || 3009;
        const apiUrl = `http://${process.env.HOST || 'localhost'}:${port}/receive-payload`;
        const qrCodeDataUrl = await (0, qrcode_util_1.generateQRCodeDataURL)(apiUrl);
        return (0, html_responses_1.getAPIHomePage)(port, apiUrl, qrCodeDataUrl);
    }
    async processPayload(payloadDto) {
        const payload = new payload_entity_1.Payload();
        payload.message = 'Received payload';
        payload.data = payloadDto ? JSON.stringify(payloadDto) : null;
        payload.timestamp = payloadDto.timestamp || Date.now();
        if (payloadDto.patientID) {
            payload.patientID = payloadDto.patientID;
        }
        else if (payloadDto.data && payloadDto.data.patientID) {
            payload.patientID = payloadDto.data.patientID;
        }
        try {
            const existingPayload = await this.payloadRepository.findOne({
                where: { patientID: payload.patientID }
            });
            let hasChanges = false;
            if (existingPayload) {
                let patient_record = payload.data;
                let existingData;
                try {
                    existingData = existingPayload.data ? JSON.parse(existingPayload.data) : {};
                }
                catch (e) {
                    existingData = {};
                }
                if (existingData && Object.keys(existingData).length === 0) {
                    console.log("Object is empty");
                }
                else if (existingData && Object.keys(existingData).length > 0) {
                    const result = (0, patient_record_utils_1.sophisticatedMergePatientData)(existingData, JSON.parse(payload.data));
                    patient_record = result.mergedData;
                    hasChanges = result.hasChanges;
                }
                try {
                    const newData = JSON.parse(payload.data);
                    let existingData = {};
                    try {
                        existingData = existingPayload.data ? JSON.parse(existingPayload.data) : {};
                    }
                    catch (e) {
                        console.log("Existing data was empty or invalid JSON");
                    }
                    const result = Object.keys(existingData).length === 0
                        ? { mergedData: newData, hasChanges: false }
                        : (0, patient_record_utils_1.sophisticatedMergePatientData)(existingData, newData);
                    const patient_record = result.mergedData;
                    hasChanges = result.hasChanges;
                    existingPayload.data = JSON.stringify(patient_record);
                }
                catch (e) {
                    console.error('Error parsing payload data:', e);
                    throw e;
                }
                existingPayload.timestamp = payload.timestamp;
                existingPayload.message = 'Updated payload';
                const updatedPayload = await this.payloadRepository.save(existingPayload);
                return {
                    success: true,
                    message: 'Payload updated successfully',
                    id: updatedPayload.id,
                    patientID: updatedPayload.patientID,
                    timestamp: new Date().toISOString(),
                    updated: true,
                    record: existingPayload.data,
                    hasChanges: hasChanges,
                };
            }
            const savedPayload = await this.payloadRepository.save(payload);
            return {
                success: true,
                message: 'Payload received and saved successfully',
                id: savedPayload.id,
                patientID: savedPayload.patientID,
                timestamp: new Date().toISOString(),
                updated: false,
                hasChanges: hasChanges,
            };
        }
        catch (error) {
            console.error('Error processing payload:', error);
            throw error;
        }
    }
    async getAllPatientIds() {
        const payloads = await this.payloadRepository.find({
            select: ['patientID']
        });
        return payloads.map(payload => payload.patientID);
    }
    async getPatientPayload(patientId) {
        const payload = await this.payloadRepository.findOne({
            where: { patientID: patientId }
        });
        return payload;
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payload_entity_1.Payload)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AppService);
//# sourceMappingURL=app.service.js.map
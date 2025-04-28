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
var DataSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSyncService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rxjs_1 = require("rxjs");
const payload_entity_1 = require("./payload.entity");
const patient_record_utils_1 = require("./utils/patient_record_utils");
const app_authService_1 = require("./app.authService");
let DataSyncService = DataSyncService_1 = class DataSyncService {
    constructor(httpService, authService, payloadRepository) {
        this.httpService = httpService;
        this.authService = authService;
        this.payloadRepository = payloadRepository;
        this.logger = new common_1.Logger(DataSyncService_1.name);
    }
    async syncPatientRecords() {
        try {
            const isAuthenticated = await this.authService.ensureAuthenticated();
            if (!isAuthenticated) {
                throw new Error('Failed to authenticate');
            }
            this.logger.log('Fetching all patient records from database');
            const allRecords = await this.payloadRepository.find();
            if (!allRecords || allRecords.length === 0) {
                this.logger.log('No records found in database to sync');
                return { success: true, message: 'No records to sync', count: 0 };
            }
            this.logger.log(`Found ${allRecords.length} records to sync`);
            const saveUrl = `${this.authService.getBaseUrl()}/api/v1/save_patient_record`;
            const results = {
                total: allRecords.length,
                successful: 0,
                failed: 0,
                errors: [],
                updatedRecords: [],
            };
            for (const record of allRecords) {
                try {
                    let parsedData = {};
                    try {
                        if (record.data) {
                            parsedData = JSON.parse(record.data);
                        }
                    }
                    catch (parseError) {
                        this.logger.warn(`Failed to parse data for record ID ${record.id}: ${parseError.message}`);
                        parsedData = {};
                    }
                    const syncPayload = {
                        record: Object.assign(Object.assign({}, parsedData), { timestamp: record.timestamp })
                    };
                    const { data: responseData } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(saveUrl, syncPayload, {
                        headers: {
                            Authorization: this.authService.getAuthToken(),
                            'Content-Type': 'application/json',
                        },
                    }).pipe((0, rxjs_1.catchError)((error) => {
                        this.logger.error(`Failed to sync record ID ${record.id}: ${error.message}`);
                        if (error.response) {
                            this.logger.error(`Response status: ${error.response.status}`);
                            this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
                        }
                        results.failed++;
                        results.errors.push({
                            recordId: record.id,
                            patientID: record.patientID,
                            error: error.message,
                        });
                        throw new Error(`API sync failed: ${error.message}`);
                    })));
                    let responseString = JSON.stringify(responseData);
                    if (responseData) {
                        if (syncPayload.record && syncPayload.record.patientID == responseData.patientID) {
                            const result = (0, patient_record_utils_1.sophisticatedMergePatientData)(syncPayload.record, responseData);
                            responseString = JSON.stringify(result.mergedData);
                        }
                        await this.payloadRepository.update({ id: record.id }, {
                            data: responseString,
                            message: 'Updated from API response'
                        });
                        this.logger.log(`Successfully synced and updated record ID ${record.id} for patient ${record.patientID}`);
                        results.successful++;
                        results.updatedRecords.push(record.id);
                    }
                }
                catch (syncError) {
                    this.logger.error(`Error processing record ID ${record.id}: ${syncError.message}`);
                    results.failed++;
                    results.errors.push({
                        recordId: record.id,
                        patientID: record.patientID,
                        error: syncError.message,
                    });
                }
            }
            this.logger.log(`Sync completed. Successfully synced and updated ${results.successful}/${results.total} records`);
            return Object.assign({ success: true, message: `Synced ${results.successful} of ${results.total} records` }, results);
        }
        catch (error) {
            this.logger.error(`Patient record sync failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async initialize() {
        try {
            await this.authService.initialize();
            this.logger.log('DataSyncService initialized successfully');
        }
        catch (error) {
            this.logger.error(`Failed to initialize DataSyncService: ${error.message}`);
        }
    }
};
exports.DataSyncService = DataSyncService;
exports.DataSyncService = DataSyncService = DataSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(payload_entity_1.Payload)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        app_authService_1.AuthService,
        typeorm_2.Repository])
], DataSyncService);
//# sourceMappingURL=app.dataSyncService.js.map
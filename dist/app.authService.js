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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const payload_entity_1 = require("./payload.entity");
const patient_record_utils_1 = require("./utils/patient_record_utils");
let AuthService = AuthService_1 = class AuthService {
    constructor(httpService, configService, userRepository, payloadRepository) {
        this.httpService = httpService;
        this.configService = configService;
        this.userRepository = userRepository;
        this.payloadRepository = payloadRepository;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.authToken = null;
        this.tokenExpiry = null;
        this.baseUrl = this.configService.get('API_BASE_URL') || 'http://192.168.0.105:3000';
    }
    async login() {
        try {
            const loginUrl = `${this.baseUrl}/api/v1/auth/login`;
            const loginData = {
                username: this.configService.get('API_USERNAME') || 'ras',
                password: this.configService.get('API_PASSWORD') || 'Ras@2025',
            };
            this.logger.log(`Attempting to login to ${loginUrl}`);
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(loginUrl, loginData).pipe((0, rxjs_1.catchError)((error) => {
                this.logger.error(`Login failed: ${error.message}`);
                if (error.response) {
                    this.logger.error(`Response status: ${error.response.status}`);
                    this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
                }
                throw new Error(`Authentication failed: ${error.message}`);
            })));
            if (data && data.authorization && data.authorization.token) {
                this.authToken = data.authorization.token;
                this.tokenExpiry = new Date(data.authorization.expiry_time);
                const user = new user_entity_1.User();
                user.id = data.authorization.user.user_id;
                user.locationId = data.authorization.user.location_id;
                const existingUsers = await this.userRepository.find();
                if (existingUsers.length > 0) {
                    await this.userRepository.remove(existingUsers);
                }
                const savedUser = await this.userRepository.save(user);
                this.logger.log(`User data saved successfully for ID: ${savedUser.id}`);
                this.logger.log(`Login successful. Token valid until: ${this.tokenExpiry}`);
                return true;
            }
            else {
                this.logger.error('Login response did not contain expected token data');
                return false;
            }
        }
        catch (error) {
            this.logger.error(`Login error: ${error.message}`, error.stack);
            return false;
        }
    }
    isTokenValid() {
        if (!this.authToken || !this.tokenExpiry) {
            return false;
        }
        const now = new Date();
        const bufferTime = 5 * 60 * 1000;
        return this.tokenExpiry.getTime() > now.getTime() + bufferTime;
    }
    async ensureAuthenticated() {
        if (this.isTokenValid()) {
            return true;
        }
        this.logger.log('Authentication token missing or expired. Logging in again...');
        return await this.login();
    }
    getAuthToken() {
        return this.authToken;
    }
    getBaseUrl() {
        return this.baseUrl;
    }
    async initialize() {
        try {
            const loggedIn = await this.login();
            if (loggedIn) {
                this.logger.log('AuthService initialized successfully');
            }
            else {
                this.logger.warn('AuthService initialized with failed authentication');
            }
            return loggedIn;
        }
        catch (error) {
            this.logger.error(`Failed to initialize AuthService: ${error.message}`);
            return false;
        }
    }
    async fetchAndSaveUserData() {
        try {
            await this.ensureAuthenticated();
            const user = await this.userRepository.findOne({
                where: {},
                order: { id: 'DESC' }
            });
            if (!user) {
                this.logger.error('No user found in the repository');
                return null;
            }
            const userUrl = `${this.baseUrl}/api/v1/users/${user.id}`;
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(userUrl, {
                headers: { Authorization: `${this.authToken}` }
            }).pipe((0, rxjs_1.catchError)((error) => {
                this.logger.error(`Failed to fetch user data: ${error.message}`);
                throw error;
            })));
        }
        catch (error) {
            this.logger.error(`Error fetching/saving user data: ${error.message}`);
            return null;
        }
    }
    async syncPatientIds() {
        try {
            await this.ensureAuthenticated();
            const PAGE_SIZE = 50;
            let currentPage = 1;
            let totalPatients = 0;
            let processedPatients = 0;
            const initialRequest = {
                previous_sync_date: "",
                page: currentPage,
                page_size: PAGE_SIZE
            };
            const firstResponse = await this.makePatientSyncRequest(initialRequest);
            firstResponse.sync_patients.forEach((patient) => {
                this.updatePayload(patient);
            });
            if (!firstResponse)
                return false;
            totalPatients = firstResponse.server_patient_count;
            processedPatients += firstResponse.sync_patients.length;
            this.logger.log(`Total patients to sync: ${totalPatients}`);
            this.logger.log(`Processed ${processedPatients} patients`);
            while (processedPatients < totalPatients) {
                currentPage++;
                const request = {
                    previous_sync_date: "",
                    page: currentPage,
                    page_size: PAGE_SIZE
                };
                const response = await this.makePatientSyncRequest(request);
                if (!response)
                    return false;
                response.sync_patients.forEach((patient) => {
                    this.updatePayload(patient);
                });
                processedPatients += response.sync_patients.length;
                this.logger.log(`Processed ${processedPatients}/${totalPatients} patients`);
            }
            this.logger.log('Patient sync completed successfully');
            return true;
        }
        catch (error) {
            this.logger.error(`Error syncing patient IDs: ${error.message}`);
            return false;
        }
    }
    async makePatientSyncRequest(request) {
        try {
            const syncUrl = `${this.baseUrl}/api/v1/sync/patients_ids`;
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(syncUrl, request, {
                headers: { Authorization: `${this.authToken}` }
            }).pipe((0, rxjs_1.catchError)((error) => {
                this.logger.error(`Sync request failed: ${error.message}`);
                throw error;
            })));
            return data;
        }
        catch (error) {
            this.logger.error(`Error making sync request: ${error.message}`);
            return null;
        }
    }
    async updatePayload(patient) {
        var _a;
        try {
            const existingPayload = await this.payloadRepository.findOne({
                where: { patientID: (_a = patient.patientID) === null || _a === void 0 ? void 0 : _a.toString() }
            });
            if (existingPayload) {
                if (existingPayload.patientID == patient.patientID) {
                    this.logger.log(`Found existing payload for patient ID: ${patient.patientID}`);
                    const result = (0, patient_record_utils_1.sophisticatedMergePatientData)(JSON.parse(existingPayload.data), patient);
                    existingPayload.data = JSON.stringify(result.mergedData);
                    await this.payloadRepository.save(existingPayload);
                }
            }
            else {
                this.logger.log(`Creating new payload for patient ID: ${patient.patientID}`);
                const newPayload = new payload_entity_1.Payload();
                newPayload.patientID = patient.patientID.toString();
                newPayload.message = 'Created payload from API';
                newPayload.timestamp = Date.now();
                newPayload.data = JSON.stringify(patient);
                await this.payloadRepository.save(newPayload);
            }
        }
        catch (error) {
            this.logger.error(`Error updating payload: ${error.message}`);
            throw error;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(payload_entity_1.Payload)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=app.authService.js.map
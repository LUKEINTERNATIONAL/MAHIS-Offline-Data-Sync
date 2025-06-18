import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AuthService } from './app.authService';
import { DDEService } from './modules/dde/ddde.service';
import { lastValueFrom } from "rxjs";

@Injectable()
export class DDE4DataSyncService {
    private readonly logger = new Logger(DDE4DataSyncService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly DDEService: DDEService,
        private readonly authService: AuthService
    ) {}

    async getDDEIDSViaExternalAPI(forceeFetch: boolean = false): Promise<any> {
        try {
            // Check if we need to fetch data (unless forced)
            if (!forceeFetch) {
                const allRecords = await this.DDEService.findAll();
                const nullStatusCount = allRecords.filter(record => record.status === null).length;
                
                if (nullStatusCount >= 10) {
                    this.logger.log(`Skipping API fetch: Found ${nullStatusCount} records with null status (>= 10 threshold)`);
                    return {
                        skipped: true,
                        reason: 'sufficient_null_status_records',
                        nullStatusCount,
                        message: `No need to fetch data. ${nullStatusCount} records with null status available.`
                    };
                }
                
                this.logger.log(`Proceeding with API fetch: Only ${nullStatusCount} records with null status (< 10 threshold)`);
            } else {
                this.logger.log('Force fetch enabled: Skipping null status count check');
            }

            const isAuthenticated = await this.authService.ensureAuthenticated();
            if (!isAuthenticated) {
                throw new Error('Failed to authenticate');
            }

            const apiUrl = this.authService.getBaseUrl();
            const token = this.authService.getAuthToken();

            const { data: responseData } = await lastValueFrom(
                this.httpService.get(`${apiUrl}/dde/patients/sync_npids?count=10&program_id=32`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: token,
                    },
                })
            );

            this.logger.log('DDE ID fetched successfully: ', responseData);

            // Process the NPID data
            if (responseData && responseData.npids && Array.isArray(responseData.npids)) {
                await this.processNpidData(responseData.npids);
            }

            return {
                ...responseData,
                skipped: false,
                fetched: true
            };
        } catch (error) {
            this.logger.error(`DDE id fetch failed: ${error.message}`, error.stack);
            // throw error;
        }
    }

    /**
     * Process and store NPID data individually
     */
    private async processNpidData(npids: any[]): Promise<void> {
        try {
            this.logger.log(`Processing ${npids.length} NPID records`);

            // Use bulk upsert for better performance
            const results = await this.DDEService.bulkUpsertNpids(npids);
            
            this.logger.log(`NPID processing completed: ${JSON.stringify(results)}`);
        } catch (error) {
            this.logger.error(`Error processing NPID data: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Sync individual NPID - useful for testing or single record sync
     */
    async syncSingleNpid(npidData: any): Promise<any> {
        try {
            const result = await this.DDEService.upsertByNpid(npidData);
            this.logger.log(`Successfully synced NPID: ${npidData.npid}`);
            return result;
        } catch (error) {
            this.logger.error(`Error syncing single NPID ${npidData.npid}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Get sync status for all NPIDs
     */
    async getSyncStatus(): Promise<any> {
        try {
            const allRecords = await this.DDEService.findAll();
            const stats = {
                total: allRecords.length,
                pending: allRecords.filter(record => record.status === null || record.status === 'pending').length,
                completed: allRecords.filter(record => record.status === 'completed').length,
                withoutData: allRecords.filter(record => !record.data || Object.keys(record.data).length === 0).length
            };
            
            this.logger.log(`Sync status: ${JSON.stringify(stats)}`);
            return stats;
        } catch (error) {
            this.logger.error(`Error getting sync status: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Check null status count and fetch more data if needed
     * Fetches new data if count of documents with null status is below 10
     */
    async checkAndReplenishNullStatusRecords(): Promise<{
        nullStatusCount: number;
        totalCount: number;
        actionTaken: 'fetched_new_data' | 'sufficient_records' | 'no_action_needed';
        message: string;
    }> {
        try {
            this.logger.log('Checking null status record count...');
            
            // Get all DDE documents
            const allRecords = await this.DDEService.findAll();
            const totalCount = allRecords.length;
            
            // Count documents with null status
            const nullStatusRecords = allRecords.filter(record => record.status === null);
            const nullStatusCount = nullStatusRecords.length;
            
            this.logger.log(`Found ${nullStatusCount} records with null status out of ${totalCount} total records`);
            
            if (nullStatusCount < 10) {
                this.logger.log(`Null status count (${nullStatusCount}) is below threshold (10). Fetching new data...`);
                
                try {
                    // Fetch new data from external API (force fetch to bypass internal check)
                    await this.getDDEIDSViaExternalAPI(true);
                    
                    return {
                        nullStatusCount,
                        totalCount,
                        actionTaken: 'fetched_new_data',
                        message: `Found ${nullStatusCount} records with null status. Fetched new data from external API.`
                    };
                } catch (fetchError) {
                    this.logger.error(`Failed to fetch new data: ${fetchError.message}`, fetchError.stack);
                    
                    return {
                        nullStatusCount,
                        totalCount,
                        actionTaken: 'no_action_needed',
                        message: `Found ${nullStatusCount} records with null status but failed to fetch new data: ${fetchError.message}`
                    };
                }
            } else {
                this.logger.log(`Null status count (${nullStatusCount}) is sufficient (>= 10). No action needed.`);
                
                return {
                    nullStatusCount,
                    totalCount,
                    actionTaken: 'sufficient_records',
                    message: `Found ${nullStatusCount} records with null status. No need to fetch new data.`
                };
            }
        } catch (error) {
            this.logger.error(`Error checking null status records: ${error.message}`, error.stack);
            throw error;
        }
    }
}
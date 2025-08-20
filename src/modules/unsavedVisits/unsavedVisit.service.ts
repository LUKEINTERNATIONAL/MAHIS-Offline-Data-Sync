import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnsavedVisit, Prisma } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AuthService} from '../SharedModule/shared.module';
import { VisitService } from '../visit/visit.service';
import { StageService } from '../stage/stage.service';

export interface CreateUnsavedVisitDto {
  visit_id: number;
  data?: any;
}

@Injectable()
export class UnsavedVisitsService {
    private readonly logger = new Logger(UnsavedVisitsService.name);
    private readonly isMongoDB: boolean;

    constructor(
        private readonly prisma: PrismaService,
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly visitService: VisitService,
        private readonly stageService: StageService
    ) {
    this.isMongoDB = process.env.DATABASE_PROVIDER === 'mongodb';
    }

    async getActiveVisits(programId: string, identifier: string): Promise<UnsavedVisit[]> {
      try {
        this.logger.log(`Fetching unsaved_visit for programId: ${programId} and patientId: ${identifier}`);
    
        if (!programId || !identifier) {
          throw new BadRequestException('Program ID and Patient ID are required.');
        }
        
        let unsavedVisits: UnsavedVisit[] = [];
    
        if (this.isMongoDB) {
          // MongoDB Raw Query
          const matchStage = {
            $match: {
              "data.programId": programId,
              "data.identifier": identifier,
            }
          };
    
          const result = await (this.prisma as any).$runCommandRaw({
            aggregate: 'unsaved_visits',
            pipeline: [
              matchStage,
              { $limit: 1000 }
            ],
            cursor: {}
          });
    
          unsavedVisits = result?.cursor?.firstBatch?.map(visit => ({
            ...visit,
            data: this.deserializeData(visit.data)
          })) || [];
    
        } else {
          // SQLite Raw Query
          const query = `
            SELECT * FROM unsaved_visits
            WHERE 
              json_extract(data, '$.programId') = ? 
              AND json_extract(data, '$.identifier') = ?
            ORDER BY "createdAt" DESC
          `;
          
          unsavedVisits = await (this.prisma as any).$queryRawUnsafe(
            query,
            programId,
            identifier
          );
    
          // Deserialize data for each visit
          unsavedVisits = unsavedVisits.map(unsaved_visit => ({
             ...this.deserializeData(unsaved_visit.data)
          }));
        }
        
        return unsavedVisits;
    
      } catch (error) {
        this.logger.error(`Failed to fetch visits for patient: ${identifier}: ${error.message}`, error.stack);
        return [];
      }
    }

    async create(createUnsavedVisitDto: CreateUnsavedVisitDto): Promise<UnsavedVisit> {
        try {
            const unsavedVisitData = {
                visit_id: createUnsavedVisitDto.visit_id,
                data: this.serializeData(createUnsavedVisitDto.data)
            };

            const createdVisit = await this.prisma.unsavedVisit.create({
                data: unsavedVisitData
            });

            return {
                 ...this.deserializeData(createdVisit.data)
            };
        } catch (error) {
            this.logger.error(`Failed to create unsaved visit: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to create unsaved visit.');
        }
    }

    async deleteUnsavedVisitByIdentifier(identifier: string): Promise<any> {
        try {
            this.logger.log(`Attempting to delete unsaved visit with data.identifier: ${identifier}`);

            if (!identifier) {
                throw new BadRequestException('Identifier is required.');
            }

            let deletionResult: any;

            if (this.isMongoDB) {
                // MongoDB Raw Query for deletion
                // Using a simple deleteOne or deleteMany
                const result = await (this.prisma as any).$runCommandRaw({
                    delete: "unsaved_visits",
                    deletes: [
                        {
                            q: {
                                "data.identifier": identifier
                            },
                            limit: 1 // To delete only one record
                        }
                    ],
                    ordered: true
                });
                deletionResult = result.n; // number of deleted documents

            } else {
                // SQLite Raw Query for deletion
                const query = `
                    DELETE FROM unsaved_visits
                    WHERE 
                    json_extract(data, '$.identifier') = ?
                `;
                
                const results = await (this.prisma as any).$executeRawUnsafe(
                    query,
                    identifier
                );
                
                deletionResult = results; // number of deleted rows
            }

            if (deletionResult === 0) {
                this.logger.warn(`Unsaved visit with identifier ${identifier} not found. No records deleted.`);
            } else {
                this.logger.log(`Successfully deleted ${deletionResult} record(s) with identifier ${identifier}.`);
            }

            return deletionResult > 0; // Return true if at least one record was deleted

        } catch (error) {
            this.logger.error(`Failed to delete unsaved visit by identifier ${identifier}: ${error.message}`, error.stack);
            return false;
        }
    }

    async delete(visitId: number): Promise<UnsavedVisit> {
        try {
            const deletedVisit = await this.prisma.unsavedVisit.delete({
                where: { visit_id: visitId }
            });

            return {
                ...deletedVisit,
                data: this.deserializeData(deletedVisit.data)
            };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                this.logger.warn(`Unsaved visit with visit_id ${visitId} not found for deletion.`);
                throw new NotFoundException(`Unsaved visit with visit_id ${visitId} not found.`);
            }
            this.logger.error(`Failed to delete unsaved visit with visit_id ${visitId}: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to delete unsaved visit.');
        }
    }

    async getUnsavedVisitByIdentifier(identifier: string): Promise<UnsavedVisit | null> {
        try {
            this.logger.log(`Fetching unsaved visit with data.identifier: ${identifier}`);
        
            if (!identifier) {
                throw new BadRequestException('Identifier is required.');
            }
            
            let unsavedVisit: UnsavedVisit | null = null;
        
            if (this.isMongoDB) {
                // MongoDB Raw Query
                const matchStage = {
                    $match: {
                        "data.identifier": identifier,
                    }
                };
        
                const result = await (this.prisma as any).$runCommandRaw({
                    aggregate: 'unsaved_visits',
                    pipeline: [
                        matchStage
                    ],
                    cursor: {}
                });

                const firstBatch = result?.cursor?.firstBatch;
                if (firstBatch && firstBatch.length > 0) {
                    const doc = firstBatch[0];
                    unsavedVisit = {
                         ...this.deserializeData(doc.data)
                    };
                }
            } else {
                // SQLite Raw Query
                const query = `
                    SELECT * FROM unsaved_visits
                    WHERE 
                    json_extract(data, '$.identifier') = ?
                `;
                
                const results = await (this.prisma as any).$queryRawUnsafe(
                    query,
                    identifier
                );

                if (results.length > 0) {
                    unsavedVisit = {
                         ...this.deserializeData(results[0].data)
                    };
                }
            }
            
            if (!unsavedVisit) {
                this.logger.warn(`Unsaved visit with identifier ${identifier} not found.`);
            }

            return unsavedVisit;
        
        } catch (error) {
            this.logger.error(`Failed to fetch unsaved visit by identifier ${identifier}: ${error.message}`, error.stack);
            return null;
        }
    }

    async syncUnsavedVisits(): Promise<void> {
        this.logger.log('Starting synchronization of unsaved visits with sync_status: pending');

        try {
            let pendingVisits: any[];

            if (this.isMongoDB) {
                // MongoDB Raw Query for filtering by a nested field
                const matchStage = {
                    $match: {
                        "data.sync_status": "pending"
                    }
                };
                const result = await (this.prisma as any).$runCommandRaw({
                    aggregate: 'unsaved_visits',
                    pipeline: [matchStage],
                    cursor: {}
                });

                pendingVisits = result?.cursor?.firstBatch?.map(visit => ({
                    ...visit,
                    data: this.deserializeData(visit.data)
                })) || [];

            } else {
                // SQLite Raw Query for filtering by a nested field
                const query = `
                    SELECT * FROM unsaved_visits
                    WHERE json_extract(data, '$.sync_status') = 'pending'
                `;
                pendingVisits = await (this.prisma as any).$queryRawUnsafe(query);

                pendingVisits = pendingVisits.map(visit => ({
                    ...visit,
                    data: this.deserializeData(visit.data)
                }));
            }

            if (pendingVisits.length === 0) {
                this.logger.log('No pending unsaved visits found to sync.');
                return;
            }

            this.logger.log(`Found ${pendingVisits.length} visits with a pending sync status. Syncing each...`);

            // Use Promise.all to concurrently process each pending visit
            const syncPromises = pendingVisits.map(async (visit) => {
                try {
                    // Call the external API for each pending visit
                    const apiResponse = await this.saveUnsavedVisitViaExternalAPI(visit.data);
                    
                    if (apiResponse && apiResponse.success) {
                        this.logger.log(`Successfully synced visit ID: ${visit.id}`);
                        // Optionally, you could update the sync_status to 'synced' here
                        // e.g., await this.updateById(visit.id, { data: { ...visit.data, sync_status: 'synced' } });
                    } else {
                        this.logger.warn(`Failed to sync visit ID: ${visit.id}. API response was not successful.`);
                    }
                } catch (apiError) {
                    this.logger.error(`Error during sync for visit ID: ${visit.id}: ${apiError.message}`);
                }
            });

            // Wait for all sync operations to complete
            await Promise.all(syncPromises);

            this.logger.log('Completed synchronization of all pending visits.');

        } catch (error) {
            this.logger.error(`Error during visit synchronization: ${error.message}`, error.stack);
        }
    }

    async syncPendingUpdateVisits(): Promise<void> {
        this.logger.log('Starting synchronization of unsaved visits with sync_status: update');

        try {
            let pendingVisits: any[];

            if (this.isMongoDB) {
                // MongoDB Raw Query for filtering by a nested field
                const matchStage = {
                    $match: {
                        "data.sync_status": "update"
                    }
                };
                const result = await (this.prisma as any).$runCommandRaw({
                    aggregate: 'unsaved_visits',
                    pipeline: [matchStage],
                    cursor: {}
                });

                pendingVisits = result?.cursor?.firstBatch?.map(visit => ({
                    ...visit,
                    data: this.deserializeData(visit.data)
                })) || [];

            } else {
                // SQLite Raw Query for filtering by a nested field
                const query = `
                    SELECT * FROM unsaved_visits
                    WHERE json_extract(data, '$.sync_status') = 'update'
                `;
                pendingVisits = await (this.prisma as any).$queryRawUnsafe(query);

                pendingVisits = pendingVisits.map(visit => ({
                    ...visit,
                    data: this.deserializeData(visit.data)
                }));
            }

            if (pendingVisits.length === 0) {
                this.logger.log('No pending unsaved visits found to sync.');
                return;
            }

            this.logger.log(`Found ${pendingVisits.length} visits with a pending sync status. Syncing each...`);

            // Use Promise.all to concurrently process each pending visit
            const syncPromises = pendingVisits.map(async (visit) => {
                try {
                    // Call the external API for each pending visit
                    const apiResponse = await this.savePendingUpdateVisitViaExternalAPI(visit.data);
                    
                    if (apiResponse && apiResponse.success) {
                        this.logger.log(`Successfully synced visit ID: ${visit.data.id}`);
                        // Optionally, you could update the sync_status to 'synced' here
                        // e.g., await this.updateById(visit.id, { data: { ...visit.data, sync_status: 'synced' } });
                    } else {
                        this.logger.warn(`Failed to sync visit ID: ${visit.data.id}. API response was not successful.`);
                    }
                } catch (apiError) {
                    this.logger.error(`Error during sync for visit ID: ${visit.data.id}: ${apiError.message}`);
                }
            });

            // Wait for all sync operations to complete
            await Promise.all(syncPromises);

            this.logger.log('Completed synchronization of all pending visits.');

        } catch (error) {
            this.logger.error(`Error during visit synchronization: ${error.message}`, error.stack);
        }
    }

    async saveUnsavedVisitViaExternalAPI(data: any): Promise<any> {

        const isAuthenticated = await this.authService.ensureAuthenticated();
        if (!isAuthenticated) {
            this.logger.error("Failed to authenticate")
        }

        if (!data) {
            throw new Error('Sync payload is required');
        }

        const saveUrl = `${this.authService.getBaseUrl()}/visits`;

        const { data: responseData } = await lastValueFrom(
            this.httpService.post(saveUrl, data, {
                headers: {
                Authorization: this.authService.getAuthToken(),
                'Content-Type': 'application/json',
                },
                timeout: 30000, // 30 second timeout
            })
        );

        if (responseData) {
            console.log(JSON.stringify(responseData));
            await this.deleteUnsavedVisitByIdentifier(responseData.visit.identifier);
            await this.visitService.deleteVisitByIdentifier(responseData.visit.identifier);
            await this.visitService.create({"visit_id": responseData.visit.id, "data": responseData.visit});

        return { success: true, responseData };
        }

        return { success: false, error: 'No response data received' };
    }

    async savePendingUpdateVisitViaExternalAPI(data: any): Promise<any> {

        const isAuthenticated = await this.authService.ensureAuthenticated();
        if (!isAuthenticated) {
            this.logger.error("Failed to authenticate")
        }

        if (!data) {
            throw new Error('Sync payload is required');
        }

        const saveUrl = `${this.authService.getBaseUrl()}/visits/close`;

        const { data: responseData } = await lastValueFrom(
            this.httpService.put(saveUrl, data, {
                headers: {
                Authorization: this.authService.getAuthToken(),
                'Content-Type': 'application/json',
                },
                timeout: 30000, // 30 second timeout
            })
        );

        if (responseData) {
            await this.deleteUnsavedVisitByIdentifier(responseData.visit.identifier);
            await this.visitService.deleteVisitByIdentifier(responseData.visit.identifier);
            await this.stageService.deleteStageByIdentifier(responseData.visit.identifier);
            await this.visitService.create({"visit_id": responseData.visit.id, "data": responseData.visit});
        return { success: true, responseData };
        }

        return { success: false, error: 'No response data received' };
    }

    private serializeData(data: any): any {
        if (data === null || data === undefined) return null;

        if (this.isMongoDB) {
        // MongoDB handles JSON objects natively
        return data;
        } else {
        // SQLite requires JSON to be stringified
        return JSON.stringify(data);
        }
    }

    private deserializeData(data: any): any {
        if (data === null || data === undefined) return null;
        
        // For SQLite, parse the JSON string
        if (process.env.DATABASE_PROVIDER?.toString() === 'sqlite' && typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (error) {
            this.logger.warn(`Failed to parse JSON data: ${error.message}`);
            return data; // Return as-is if parsing fails
        }
        }
        
        return data; // MongoDB case or already parsed
    }
}
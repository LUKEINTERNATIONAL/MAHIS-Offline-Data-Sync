import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnsavedVisit, Prisma } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../SharedModule/shared.module';
import { VisitService } from '../visit/visit.service';
import { StageService } from '../stage/stage.service';

export interface CreateUnsavedVisitDto {
  visit_id: number;
  data?: any;
}

export interface VisitQueryOptions {
  limit?: number;
  skip?: number;
  sort?: any;
}

@Injectable()
export class UnsavedVisitsService {
    private readonly logger = new Logger(UnsavedVisitsService.name);
    private readonly isMongoDB: boolean;

    private getDateRange(dateString: string): [Date, Date] {
        const startDate = new Date(dateString);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateString);
        endDate.setHours(23, 59, 59, 999);
        return [startDate, endDate];
    }

    private convertSortToPrisma(sort: any): Prisma.VisitOrderByWithRelationInput {
        if (typeof sort === 'string') {
        const field = sort.startsWith('-') ? sort.substring(1) : sort;
        const direction = sort.startsWith('-') ? 'desc' : 'asc';
        return { [field]: direction };
        }
        
        if (typeof sort === 'object') {
        const orderBy: Prisma.VisitOrderByWithRelationInput = {};
        for (const [field, direction] of Object.entries(sort)) {
            orderBy[field] = direction === -1 || direction === 'desc' ? 'desc' : 'asc';
        }
        return orderBy;
        }
        
        return { visit_id: 'asc' }; // Default sort
    }

    constructor(
        private readonly prisma: PrismaService,
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly visitService: VisitService,
        private readonly stageService: StageService
    ) {
    this.isMongoDB = process.env.DATABASE_PROVIDER === 'mongodb';
    }

    async getTodaysVisits(programId: string, date: string): Promise<any[]> {
        try {
          this.logger.log(`Fetching visits for programId: ${programId} on date: ${date}`);
    
          if (!programId || !date) {
            throw new BadRequestException('Program ID and date are required.');
          }
          
          let visits: any[] = [];
    
          if (this.isMongoDB) {
            // MongoDB Raw Query
            const [startDate, endDate] = this.getDateRange(date);
            
            const matchStage = {
              $match: {
                "data.programId": programId,
                "data.startDate": {
                  $gte: startDate.toISOString(),
                  $lt: endDate.toISOString(),
                }
              }
            };
    
            const result = await (this.prisma as any).$runCommandRaw({
              aggregate: 'unsaved_visits',
              pipeline: [
                matchStage,
                { $limit: 1000 } // Add a limit to prevent fetching too many records
              ],
              cursor: {}
            });
    
            visits = result?.cursor?.firstBatch?.map(this.deserializeData) || [];
    
          } else {
            // SQLite Raw Query
            const startDate = `${date}T00:00:00.000Z`;
            const endDate = `${date}T23:59:59.999Z`;
    
            const query = `
              SELECT * FROM unsaved_visits
              WHERE 
                json_extract(data, '$.programId') = ? 
                AND json_extract(data, '$.startDate') BETWEEN ? AND ?
              ORDER BY "createdAt" DESC
            `;
            
            visits = await (this.prisma as any).$queryRawUnsafe(
              query,
              programId,
              startDate,
              endDate
            );
          }
          
          return visits.map(visit => ({
            ...this.deserializeData(visit.data)
          }));
    
        } catch (error) {
          this.logger.error(`Failed to fetch visits: ${error.message}`, error.stack);
          return [];
        }
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

      async createBus(data: any): Promise<any | null> {
        try {
            // Generate a positive number that fits within a standard INT column
            const min = 1; // Smallest positive integer
            const max = 2147483647; // Maximum value for a signed 32-bit INT
            const visit_id = Math.floor(Math.random() * (max - min + 1)) + min;
            this.logger.log(`Generated new visit_id: ${visit_id}`);

            data.id = JSON.stringify(visit_id); // Ensure the data has the visit_id
            data.patientId = data.identifier; // Ensure the data has the patientId
            const newVisitDto: any = {
                visit_id,
                data
            };
    
            await this.deleteUnsavedVisitByIdentifier(data.identifier);
    
            const createdVisit = await this.create(newVisitDto);
            
            if (createdVisit) {
                this.logger.log(`Successfully created visit with visit_id: ${createdVisit.visit_id}`);
            } else {
                this.logger.error(`Failed to create visit with generated visit_id: ${visit_id}`);
            }
    
            return createdVisit.data;
    
        } catch (error) {
            this.logger.error(`Failed to execute createBus: ${error.message}`, error.stack);
            return null;
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

      async findAll(options?: VisitQueryOptions): Promise<any[]> {
        try {
          const queryOptions: Prisma.VisitFindManyArgs = {};
    
          if (options?.skip) {
            queryOptions.skip = options.skip;
          }
    
          if (options?.limit) {
            queryOptions.take = options.limit;
          }
    
          if (options?.sort) {
            // Convert Mongoose sort format to Prisma orderBy
            queryOptions.orderBy = this.convertSortToPrisma(options.sort);
          }
    
          const unsavedVisits = await this.prisma.unsavedVisit.findMany(queryOptions as any);
          
          // Deserialize data for each visit
          return unsavedVisits.map(unsavedVisit => ({
            ...unsavedVisit,
            data: this.deserializeData(unsavedVisit.data)
          }));
        } catch (error) {
          this.logger.error(`Failed to fetch visits: ${error.message}`, error.stack);
          return [];
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
            console.log(JSON.stringify(responseData));
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
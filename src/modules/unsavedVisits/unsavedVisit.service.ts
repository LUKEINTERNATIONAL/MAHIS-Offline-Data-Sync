import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnsavedVisit, Prisma } from '@prisma/client';

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
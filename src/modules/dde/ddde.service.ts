import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DDE, DDEStatus } from '@prisma/client';

@Injectable()
export class DDEService {
    private readonly logger = new Logger(DDEService.name);
    
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async create(data: Partial<DDE>): Promise<DDE> {
        return this.prisma.dDE.create({
            data: data as any
        });
    }

    async findAll(): Promise<DDE[]> {
        return this.prisma.dDE.findMany();
    }

    /**
     * Get a random document where status is null and mark it as pending
     * This ensures the document is reserved for processing
     */
    async findRandomWithNullStatus(): Promise<DDE | null> {
        try {
            // Find a random document with null status
            const documents = await this.prisma.dDE.findMany({
                where: { status: null },
                take: 1
            });

            if (documents.length === 0) {
                this.logger.log('No documents with null status found');
                return null;
            }

            // Update the found document to pending status
            const updatedDoc = await this.prisma.dDE.update({
                where: { id: documents[0].id },
                data: { status: DDEStatus.pending }
            });

            this.logger.log(`Found and marked document as pending for NPID: ${updatedDoc.npid}`);
            return updatedDoc;
        } catch (error) {
            this.logger.error(`Error finding random document with null status: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Upsert DDE document by NPID
     * Creates new document if not exists, updates only missing fields if exists
     */
    async upsertByNpid(npidData: any): Promise<DDE> {
        const npid = npidData.npid;
        
        if (!npid) {
            throw new Error('NPID is required');
        }

        try {
            // Find existing document
            const existingDoc = await this.prisma.dDE.findUnique({
                where: { npid }
            });

            if (existingDoc) {
                // Update only missing fields
                const updateData: any = {};
                
                // Only update data if it doesn't exist or is empty
                if (!existingDoc.data || Object.keys(existingDoc.data as any).length === 0) {
                    updateData.data = npidData;
                }

                // If there are fields to update
                if (Object.keys(updateData).length > 0) {
                    const updatedDoc = await this.prisma.dDE.update({
                        where: { npid },
                        data: updateData
                    });
                    
                    this.logger.log(`Updated DDE document for NPID: ${npid}`);
                    return updatedDoc;
                } else {
                    this.logger.log(`No updates needed for NPID: ${npid}`);
                    return existingDoc;
                }
            } else {
                // Create new document
                const newDoc = await this.prisma.dDE.create({
                    data: {
                        npid,
                        data: npidData,
                        status: null // Initially null as requested
                    }
                });
                
                this.logger.log(`Created new DDE document for NPID: ${npid}`);
                return newDoc;
            }
        } catch (error) {
            this.logger.error(`Error upserting DDE document for NPID ${npid}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Bulk upsert multiple NPID objects
     */
    async bulkUpsertNpids(npidObjects: any[]): Promise<{ created: number; updated: number; errors: any[] }> {
        const results = { created: 0, updated: 0, errors: [] };

        for (const npidObj of npidObjects) {
            try {
                const existingDoc = await this.prisma.dDE.findUnique({
                    where: { npid: npidObj.npid }
                });
                
                if (existingDoc) {
                    // Update logic for existing document
                    const updateData: any = {};
                    
                    if (!existingDoc.data || Object.keys(existingDoc.data as any).length === 0) {
                        updateData.data = npidObj;
                    }

                    if (Object.keys(updateData).length > 0) {
                        await this.prisma.dDE.update({
                            where: { npid: npidObj.npid },
                            data: updateData
                        });
                        results.updated++;
                    }
                } else {
                    // Create new document
                    await this.prisma.dDE.create({
                        data: {
                            npid: npidObj.npid,
                            data: npidObj,
                            status: null
                        }
                    });
                    results.created++;
                }
            } catch (error) {
                this.logger.error(`Error processing NPID ${npidObj.npid}: ${error.message}`);
                results.errors.push({
                    npid: npidObj.npid,
                    error: error.message
                });
            }
        }

        this.logger.log(`Bulk upsert completed: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`);
        return results;
    }

    /**
     * Find DDE document by NPID
     */
    async findByNpid(npid: string): Promise<DDE | null> {
        return this.prisma.dDE.findUnique({
            where: { npid }
        });
    }

    /**
     * Update status of DDE document
     */
    async updateStatus(npid: string, status: DDEStatus): Promise<DDE | null> {
        try {
            return await this.prisma.dDE.update({
                where: { npid },
                data: { status }
            });
        } catch (error) {
            // If record not found, return null
            if (error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    }

    /**
     * Mark DDE document as completed by NPID
     * Returns the updated document if found, null if not found
     */
    async markAsCompleted(npid: string): Promise<DDE | null> {
        try {
            if (!npid) {
                throw new Error('NPID is required');
            }

            const updatedDoc = await this.prisma.dDE.update({
                where: { npid },
                data: { status: DDEStatus.completed }
            });

            this.logger.log(`Successfully marked DDE document as completed for NPID: ${npid}`);
            return updatedDoc;
        } catch (error) {
            // If record not found, return null
            if (error.code === 'P2025') {
                this.logger.warn(`No DDE document found for NPID: ${npid}`);
                return null;
            }
            
            this.logger.error(`Error marking DDE document as completed for NPID ${npid}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Mark a DDE document as completed by NPID with detailed response
     * Checks if document exists and updates status to completed
     */
    async markNpidAsCompleted(npid: string): Promise<{
        found: boolean;
        updated: boolean;
        document?: DDE;
        message: string;
    }> {
        try {
            if (!npid) {
                throw new Error('NPID is required');
            }

            this.logger.log(`Attempting to mark NPID as completed: ${npid}`);

            // Check if document exists and update status
            const updatedDoc = await this.markAsCompleted(npid);

            if (updatedDoc) {
                return {
                    found: true,
                    updated: true,
                    document: updatedDoc,
                    message: `Successfully marked NPID ${npid} as completed`
                };
            } else {
                return {
                    found: false,
                    updated: false,
                    message: `No DDE document found for NPID: ${npid}`
                };
            }
        } catch (error) {
            this.logger.error(`Error marking NPID as completed ${npid}: ${error.message}`, error.stack);
            return {
                found: false,
                updated: false,
                message: `Error: ${error.message}`
            };
        }
    }
}
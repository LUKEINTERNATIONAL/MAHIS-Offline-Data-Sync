import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DDE, DDEDocument, DDEStatus } from './schema/dde.shema';

@Injectable()
export class DDEService {
    private readonly logger = new Logger(DDEService.name);
    
    constructor(
        @InjectModel(DDE.name) 
        private readonly DDEModel: Model<DDEDocument>
    ) {}

    async create(data: Partial<DDE>): Promise<DDE> {
        return this.DDEModel.create(data);
    }

    async findAll(): Promise<DDE[]> {
        return this.DDEModel.find().exec();
    }

    /**
     * Get a random document where status is null and mark it as pending
     * This ensures the document is reserved for processing
     */
    async findRandomWithNullStatus(): Promise<DDE | null> {
        try {
            // Use findOneAndUpdate with atomic operation to avoid race conditions
            const updatedDoc = await this.DDEModel.findOneAndUpdate(
                { status: null },
                { $set: { status: DDEStatus.PENDING } },
                { 
                    new: true, // Return the updated document
                    runValidators: true
                }
            ).exec();

            if (updatedDoc) {
                this.logger.log(`Found and marked document as pending for NPID: ${updatedDoc.npid}`);
            } else {
                this.logger.log('No documents with null status found');
            }

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
            const existingDoc = await this.DDEModel.findOne({ npid }).exec();

            if (existingDoc) {
                // Update only missing fields
                const updateData: any = {};
                
                // Only update data if it doesn't exist or is empty
                if (!existingDoc.data || Object.keys(existingDoc.data).length === 0) {
                    updateData.data = npidData;
                }

                // Only update status if it's null/undefined
                if (existingDoc.status === null || existingDoc.status === undefined) {
                    // Keep status as null initially, don't set to PENDING
                    // updateData.status = DDEStatus.PENDING;
                }

                // If there are fields to update
                if (Object.keys(updateData).length > 0) {
                    const updatedDoc = await this.DDEModel.findOneAndUpdate(
                        { npid },
                        { $set: updateData },
                        { new: true, runValidators: true }
                    ).exec();
                    
                    this.logger.log(`Updated DDE document for NPID: ${npid}`);
                    return updatedDoc;
                } else {
                    this.logger.log(`No updates needed for NPID: ${npid}`);
                    return existingDoc;
                }
            } else {
                // Create new document
                const newDoc = await this.DDEModel.create({
                    npid,
                    data: npidData,
                    status: null // Initially null as requested
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
                const existingDoc = await this.DDEModel.findOne({ npid: npidObj.npid }).exec();
                
                if (existingDoc) {
                    // Update logic for existing document
                    const updateData: any = {};
                    
                    if (!existingDoc.data || Object.keys(existingDoc.data).length === 0) {
                        updateData.data = npidObj;
                    }

                    if (Object.keys(updateData).length > 0) {
                        await this.DDEModel.findOneAndUpdate(
                            { npid: npidObj.npid },
                            { $set: updateData },
                            { new: true, runValidators: true }
                        ).exec();
                        results.updated++;
                    }
                } else {
                    // Create new document
                    await this.DDEModel.create({
                        npid: npidObj.npid,
                        data: npidObj,
                        status: null
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
        return this.DDEModel.findOne({ npid }).exec();
    }

    /**
     * Update status of DDE document
     */
    async updateStatus(npid: string, status: DDEStatus): Promise<DDE | null> {
        return this.DDEModel.findOneAndUpdate(
            { npid },
            { $set: { status } },
            { new: true, runValidators: true }
        ).exec();
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

            const updatedDoc = await this.DDEModel.findOneAndUpdate(
                { npid },
                { $set: { status: DDEStatus.COMPLETED } },
                { new: true, runValidators: true }
            ).exec();

            if (updatedDoc) {
                this.logger.log(`Successfully marked DDE document as completed for NPID: ${npid}`);
            } else {
                this.logger.warn(`No DDE document found for NPID: ${npid}`);
            }

            return updatedDoc;
        } catch (error) {
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
            //throw error;
        }
    }
}
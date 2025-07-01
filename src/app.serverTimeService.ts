import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { LocalStorage } from 'node-localstorage';
import * as path from 'path';

export interface ServerTimeData {
    time: string;
    date: string;
    lastUpdated: string; // ISO timestamp
}

@Injectable()
export class ServerTimeService implements OnModuleInit {
    private readonly logger = new Logger(ServerTimeService.name);
    private baseUrl: string;
    private localStorage: LocalStorage;
    private readonly STORAGE_KEY = 'server_time_data';
    private checkInterval: NodeJS.Timeout;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        this.baseUrl = this.configService.get<string>('API_BASE_URL');
        
        // Initialize localStorage with a storage directory
        const storageDir = path.join(process.cwd(), 'storage');
        this.localStorage = new LocalStorage(storageDir);
    }

    async onModuleInit() {
        // Start the daily check when the module initializes
        await this.initializeDailyCheck();
    }

    /**
     * Get server time and date from API
     */
    async getServerTimeAndDate(): Promise<ServerTimeData> {
        const currentTimeUrl = `${this.baseUrl}/current_time`;

        this.logger.log('Fetching server time from API...');
        
        try {
            const { data } = await firstValueFrom(
                this.httpService.get<any>(currentTimeUrl).pipe(
                    catchError((error: AxiosError) => {
                        this.logger.error(`Getting server time failed: ${error.message}`);
                        if (error.response) {
                            this.logger.error(`Response status: ${error.response.status}`);
                            this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
                        }
                        throw new Error(`Getting server time failed: ${error.message}`);
                    }),
                ),
            );

            if (data) {
                const serverTimeData: ServerTimeData = {
                    ...data,
                    lastUpdated: new Date().toISOString()
                };

                this.logger.log(`Server time and date: ${JSON.stringify(data)}`);
                
                // Store the data
                await this.storeServerTimeData(serverTimeData);
                
                return serverTimeData;
            }
        } catch (error) {
            this.logger.error('Failed to fetch server time, checking stored data...');
            // If API call fails, return stored data if available
            const storedData = this.getStoredServerTimeData();
            if (storedData) {
                this.logger.log('Returning stored server time data');
                return storedData;
            }
            throw error;
        }
    }

    /**
     * Store server time data in localStorage
     */
    private async storeServerTimeData(data: ServerTimeData): Promise<void> {
        try {
            this.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            this.logger.log('Server time data stored successfully');
        } catch (error) {
            this.logger.error(`Failed to store server time data: ${error.message}`);
        }
    }

    /**
     * Get stored server time data from localStorage
     */
    getStoredServerTimeData(): ServerTimeData | null {
        try {
            // this.updateStoredDateIfDayPassed();
            const storedData = this.localStorage.getItem(this.STORAGE_KEY);
            if (storedData) {
                const parsedData: ServerTimeData = JSON.parse(storedData);
                this.logger.log(`Retrieved stored server time data: ${JSON.stringify(parsedData)}`);
                return parsedData;
            }
            return null;
        } catch (error) {
            this.logger.error(`Failed to retrieve stored server time data: ${error.message}`);
            return null;
        }
    }

    /**
     * Check if a day has passed since last update using timestamp arithmetic
     */
    private hasDayPassedSinceLastUpdate(): boolean {
        const storedData = this.getStoredServerTimeData();
        if (!storedData || !storedData.lastUpdated) {
            return true; // No stored data, so update needed
        }

        // Get current machine date (year, month, day only)
        const currentDate = new Date();
        const currentDateOnly = new Date(
            currentDate.getFullYear(), 
            currentDate.getMonth(), 
            currentDate.getDate()
        );

        // Get stored date (year, month, day only)
        const storedDate = new Date(storedData.lastUpdated);
        
        // Check if stored date is valid
        if (isNaN(storedDate.getTime())) {
            return true; // Invalid stored date, trigger update
        }
        
        const storedDateOnly = new Date(
            storedDate.getFullYear(), 
            storedDate.getMonth(), 
            storedDate.getDate()
        );

        // Compare dates: if current date > stored date, return true for update
        return currentDateOnly.getTime() > storedDateOnly.getTime();
    }

    /**
     * Initialize daily check mechanism
     */
    private async initializeDailyCheck(): Promise<void> {
        this.logger.log('Initializing daily check mechanism...');
        
        // Check immediately on startup
        await this.checkAndUpdateIfNeeded();
        
        // Set up interval to check every hour (you can adjust this)
        this.checkInterval = setInterval(async () => {
            await this.checkAndUpdateIfNeeded();
        }, 60 * 60 * 1000); // Check every hour
        
        this.logger.log('Daily check mechanism initialized');
    }

    /**
     * Update stored date when a day has passed (even if API is unavailable)
     */
    private updateStoredDateIfDayPassed(): void {
        const storedData = this.getStoredServerTimeData();
        if (!storedData) return;

        if (true) {
            try {
                const lastUpdateTime = new Date(storedData.lastUpdated).getTime();
                const currentTime = Date.now();
                const daysPassed = Math.floor((currentTime - lastUpdateTime) / (24 * 60 * 60 * 1000));

                console.log(`Days passed since last update: ${daysPassed}`);

                // Get current machine date (year, month, day only)
                const currentDate = new Date();
                const currentDateOnly = new Date(
                    currentDate.getFullYear(), 
                    currentDate.getMonth(), 
                    currentDate.getDate()
                );

                const storedDateForComparison = new Date(storedData.date);
                
                // Check if stored date is valid
                if (isNaN(storedDateForComparison.getTime())) {
                    // return true; // Invalid stored date, trigger update
                }
                
                const storedDateOnly = new Date(
                    storedDateForComparison.getFullYear(), 
                    storedDateForComparison.getMonth(), 
                    storedDateForComparison.getDate()
                );

                if (currentDateOnly.getTime() > storedDateOnly.getTime()) {
                    // Calculate new date by adding days passed
                    const storedDate = new Date(storedData.date);
                    storedDate.setDate(storedDate.getDate() + daysPassed);
                    const newDate = currentDateOnly.toISOString().split('T')[0]; // YYYY-MM-DD format

                    const updatedData: ServerTimeData = {
                        ...currentDateOnly,
                        date: newDate,
                        lastUpdated: new Date().toISOString()
                    } as any;

                    this.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData));
                    this.logger.log(`Updated stored date from ${storedData.date} to ${newDate} (${daysPassed} days passed)`);
                }
            } catch (error) {
                this.logger.error(`Failed to update stored date: ${error.message}`);
            }
        }
    }

    /**
     * Check if update is needed and update if necessary
     */
    async checkAndUpdateIfNeeded(): Promise<boolean> {
        try {
            // First, update stored date if a day has passed (works even if API is down)
            this.updateStoredDateIfDayPassed();

            // Then try to fetch fresh data from API if a day has passed
            if (this.hasDayPassedSinceLastUpdate()) {
                this.logger.log('A day has passed, attempting to fetch fresh server time...');
                try {
                    await this.getServerTimeAndDate();
                    return true; // Successfully updated from API
                } catch (error) {
                    this.logger.warn('API unavailable, but stored date was updated locally');
                    return true; // Date was still updated locally
                }
            } else {
                this.logger.log('Less than a day has passed, no update needed');
                return false; // No update needed
            }
        } catch (error) {
            this.logger.error(`Failed to check and update server time: ${error.message}`);
            return false;
        }
    }

    /**
     * Force update server time data
     */
    async forceUpdateServerTime(): Promise<ServerTimeData> {
        this.logger.log('Force updating server time data...');
        return await this.getServerTimeAndDate();
    }

    /**
     * Clear stored server time data
     */
    clearStoredData(): void {
        try {
            this.localStorage.removeItem(this.STORAGE_KEY);
            this.logger.log('Stored server time data cleared');
        } catch (error) {
            this.logger.error(`Failed to clear stored data: ${error.message}`);
        }
    }

    /**
     * Get time since last update in minutes
     */
    getTimeSinceLastUpdate(): number {
        this.updateStoredDateIfDayPassed();
        const storedData = this.getStoredServerTimeData();
        if (!storedData || !storedData.lastUpdated) {
            return -1; // No stored data
        }

        const lastUpdated = new Date(storedData.lastUpdated);
        const now = new Date();
        const diffInMs = now.getTime() - lastUpdated.getTime();
        return Math.floor(diffInMs / (1000 * 60)); // Convert to minutes
    }

    /**
     * Clean up intervals when service is destroyed
     */
    onModuleDestroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.logger.log('Daily check interval cleared');
        }
    }
}
// shared.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServerTimeService } from '../../app.serverTimeService';
// Import and export other services like PrismaService here

@Module({
    imports: [HttpModule],
    providers: [ServerTimeService],
    exports: [ServerTimeService],
})
export class SharedModule {}

export { ServerTimeService };

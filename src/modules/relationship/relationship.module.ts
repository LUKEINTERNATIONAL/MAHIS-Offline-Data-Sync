import { Module } from '@nestjs/common';
import { RelationshipController } from './relationshio.controller';
import { RelationshipService } from './relationship.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule,
    AuthModule
  ],
  controllers: [RelationshipController],
  providers: [RelationshipService],
  exports: [RelationshipService], 
})
export class RelationshipModule {}

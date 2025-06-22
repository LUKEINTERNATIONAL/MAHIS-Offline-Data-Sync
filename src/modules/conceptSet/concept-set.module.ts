import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConceptSetController } from './concept-set.controller';
import { ConceptSetService } from './concept-set.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule,
    AuthModule
  ],
  controllers: [ConceptSetController],
  providers: [ConceptSetService],
  exports: [ConceptSetService], 
})
export class ConceptSetModule {}

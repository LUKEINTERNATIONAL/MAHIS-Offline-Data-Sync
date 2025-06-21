import { Module } from '@nestjs/common';
import { ConceptNameController } from './concept-name.controller';
import { ConceptNameService } from './concept-name.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [
    HttpModule,
    AuthModule
  ],
  controllers: [ConceptNameController],
  providers: [ConceptNameService],
  exports: [ConceptNameService], 
})
export class ConceptNameModule {}

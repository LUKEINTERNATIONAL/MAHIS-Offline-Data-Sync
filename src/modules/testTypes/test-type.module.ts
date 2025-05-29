import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TestType, TestTypeSchema } from './schema/test-type.schema';
import { TestTypeController } from './test-type.controller';
import { TestTypeService } from './test-type.service';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: TestType.name, schema: TestTypeSchema }]),
  ],
  controllers: [TestTypeController],
  providers: [TestTypeService],
//   exports: [ConceptNameService], 
})
export class TestTypeModule {}

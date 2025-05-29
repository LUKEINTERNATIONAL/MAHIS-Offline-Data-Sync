import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestResultIndicator, TestResultIndicatorSchema } from './schema/test-result-indicator.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: TestResultIndicator.name, schema: TestResultIndicatorSchema }]),
  ],
//   controllers: [ConceptNameController],
//   providers: [ConceptNameService],
//   exports: [ConceptNameService], 
})
export class TestResultIndicatorModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Stock, StockSchema } from './schema/stock.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Stock.name, schema: StockSchema }]),
  ],
//   controllers: [ConceptNameController],
//   providers: [ConceptNameService],
//   exports: [ConceptNameService], 
})
export class StockModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Payload } from './payload.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [Payload],
      synchronize: true, // Only use in development!
    }),
    TypeOrmModule.forFeature([Payload]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
import { Module } from "@nestjs/common";
import { DrugController } from "./drug.controller";
import { DrugService } from "./drug.service";
import { HttpModule } from "@nestjs/axios";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    HttpModule,
    AuthModule
  ],
  controllers: [DrugController],
  providers: [DrugService],
  exports: [DrugService],
})
export class DrugModule {}

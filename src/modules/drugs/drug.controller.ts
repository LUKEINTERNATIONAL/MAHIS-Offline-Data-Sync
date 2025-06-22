import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
} from "@nestjs/common";
import { DrugService } from "./drug.service";
import { Drug } from "@prisma/client";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("drugs")
@Controller("drugs")
export class DrugController {
  constructor(private readonly drugService: DrugService) {}

  // @Post()
  // async create(@Body() body: Partial<Drug>) {
  //   return this.drugService.create(body);
  // }

  @Get()
  @ApiOperation({ summary: "Get all drugs" })
  @ApiResponse({ status: 200, description: "List all drugs" })
  async findAll(): Promise<Drug[]> {
    return this.drugService.findAll();
  }
}

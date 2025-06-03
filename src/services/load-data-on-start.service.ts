import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConceptSetService } from "../modules/conceptSet/concept-set.service";
import { ConceptNameService } from "../modules/conceptName/concept-name.service";
import { FacilityService } from "../modules/facilities/facilities.service";

@Injectable()
export class LoadDataOnStartService implements OnModuleInit {
  constructor(
    private conceptSetService: ConceptSetService,
    private conceptNameService: ConceptNameService,
    private facilityService: FacilityService, // Assuming you have a FacilityService for loading facility data
  ) {}

  async onModuleInit() {
    console.log("Loading concept set data on module initialization...");
    await this.conceptSetService.loadConceptSet();
    await this.conceptNameService.loadConceptNames();
    await this.facilityService.loadFacilities();
  }
}

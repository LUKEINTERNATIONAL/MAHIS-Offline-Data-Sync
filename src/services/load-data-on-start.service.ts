import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConceptSetService } from "../modules/conceptSet/concept-set.service";
import { ConceptNameService } from "../modules/conceptName/concept-name.service";
import { FacilityService } from "../modules/facilities/facilities.service";
import { CountryService } from "../modules/country/country.service";
import { DrugService } from "../modules/drugs/drug.service";
import { RelationshipService } from "../modules/relationship/relationship.service";

@Injectable()
export class LoadDataOnStartService implements OnModuleInit {
  constructor(
    private conceptSetService: ConceptSetService,
    private conceptNameService: ConceptNameService,
    private facilityService: FacilityService,
    private countryService: CountryService,
    private drugService: DrugService,
    private relationshipService: RelationshipService,
  ) {}

  async onModuleInit() {
    console.log("Loading concept set data on module initialization...");
    await this.conceptSetService.loadConceptSet();
    await this.conceptNameService.loadConceptNames();
    await this.facilityService.loadFacilities();
    await this.countryService.loadCountries();
    await this.drugService.loadDrugs();
    await this.relationshipService.loadRelationships();
  }
}

import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConceptSetService } from "../modules/conceptSet/concept-set.service";
import { ConceptNameService } from "../modules/conceptName/concept-name.service";
import { FacilityService } from "../modules/facilities/facilities.service";
import { CountryService } from "../modules/country/country.service";
import { DrugService } from "../modules/drugs/drug.service";
import { RelationshipService } from "../modules/relationship/relationship.service";
import { WardService } from "../modules/wards/ward.service";
import { TestTypeService } from "../modules/testTypes/test-type.service";
import { TraditionalAuthorityService } from "../modules/traditionalAuthority/traditional-authority.service";
import { VillageService } from "../modules/village/village.service";
import { TestResultIndicatorService } from "../modules/testResultIndicator/res-result-indicator.service";
import { StockService } from "../modules/stock/stock.service";
import { DiagnosisService } from "../modules/diagnosis/diagnosis.service";
import { SpecimenService } from "../modules/specimen/specimen.service";

@Injectable()
export class LoadDataOnStartService implements OnModuleInit {
  constructor(
    private conceptSetService: ConceptSetService,
    private conceptNameService: ConceptNameService,
    private facilityService: FacilityService,
    private countryService: CountryService,
    private drugService: DrugService,
    private relationshipService: RelationshipService,
    private wardService: WardService,
    private testTypesService: TestTypeService,
    private traditionalAuthorityService: TraditionalAuthorityService,
    private villageService: VillageService,
    private testResultIndicatorService: TestResultIndicatorService,
    private stockService: StockService, 
    private diagnosisService: DiagnosisService,
    private specimenService: SpecimenService
  ) {}

  async onModuleInit() {
    console.log("Loading concept set data on module initialization...");
    await this.conceptSetService.loadConceptSet();
    await this.conceptNameService.loadConceptNames();
    await this.facilityService.loadFacilities();
    await this.countryService.loadCountries();
    await this.drugService.loadDrugs();
    await this.relationshipService.loadRelationships();
    await this.wardService.loadWards();
    await this.traditionalAuthorityService.loadTraditionalAuthorities();
    await this.villageService.loadVillages();
    await this.testTypesService.loadTestTypes();
    await this.testResultIndicatorService.loadIndicators();
    await this.stockService.loadStock();
    await this.diagnosisService.loadDiagnoses();
    await this.specimenService.loadSpecimen();

  }
}

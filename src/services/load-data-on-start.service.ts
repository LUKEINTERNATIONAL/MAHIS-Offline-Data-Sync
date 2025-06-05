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
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import { AuthService } from "../modules/auth/auth.service";

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
    private specimenService: SpecimenService,
    private httpService: HttpService,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  async onModuleInit() {
    await this.authService.initialize()
    const apiUrl = this.authService.getBaseUrl();
    const token =  this.authService.getAuthToken();

    const totalsResponse$ = await this.httpService.get(
      `${apiUrl}/totals?paginate=false`, {headers:{
        Authorization:token
      }}
    );
    const totalsResponse = await lastValueFrom(totalsResponse$);
    await this.conceptNameService.loadConceptNames(totalsResponse.data.total_concept_names);
    await this.conceptSetService.loadConceptSet(totalsResponse.data.total_concept_set);
  
    await this.facilityService.loadFacilities(totalsResponse.data.total_facilities);
    await this.countryService.loadCountries();
    await this.drugService.loadDrugs(totalsResponse.data.total_OPD_drugs);
    await this.relationshipService.loadRelationships(totalsResponse.data.total_relationships);
    await this.wardService.loadWards();
    await this.traditionalAuthorityService.loadTraditionalAuthorities(totalsResponse.data.total_TA);
    await this.villageService.loadVillages(totalsResponse.data.total_village);
    await this.testTypesService.loadTestTypes(totalsResponse.data.total_test_types);
    await this.testResultIndicatorService.loadIndicators();
    await this.stockService.loadStock();
    await this.diagnosisService.loadDiagnoses(totalsResponse.data.total_diagnosis);
    await this.specimenService.loadSpecimens(totalsResponse.data.total_specimens)
  }
}

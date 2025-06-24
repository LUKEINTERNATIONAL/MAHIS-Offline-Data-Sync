import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConceptSetService } from "../modules/conceptSet/concept-set.service";
import { ConceptNameService } from "../modules/conceptName/concept-name.service";
import { FacilitiesService } from "../modules/facilities/facilities.service";
import { CountryService } from "../modules/country/country.service";
import { DrugService } from "../modules/drugs/drug.service";
import { RelationshipService } from "../modules/relationship/relationship.service";
import { WardService } from "../modules/wards/ward.service";
import { TestTypeService } from "../modules/testTypes/test-type.service";
import { TraditionalAuthorityService } from "../modules/traditionalAuthority/traditional-authority.service";
import { VillageService } from "../modules/village/village.service";
import { TestResultIndicatorService } from "../modules/testResultIndicator/test-result-indicator.service";
import { StockService } from "../modules/stock/stock.service";
import { DiagnosisService } from "../modules/diagnosis/diagnosis.service";
import { SpecimenService } from "../modules/specimen/specimen.service";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import { AuthService } from "../app.authService";
@Injectable()
export class LoadDataOnStartService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private conceptSetService: ConceptSetService,
    private conceptNameService: ConceptNameService,
    private facilitiesService: FacilitiesService,
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
     private readonly httpService: HttpService,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  async onModuleInit() {
    try {
          const apiUrl = this.authService.getBaseUrl();
          
          const { data: responseData } = await lastValueFrom(
            this.httpService.get(`${apiUrl}/totals?paginate=false`, {
              headers: {
                'Content-Type': 'application/json',
              },
            })
          );

          // await this.conceptNameService.loadConceptNames(responseData.total_concept_names);
          // await this.conceptSetService.loadConceptSet(responseData.total_concept_set);
        
          // await this.facilitiesService.loadFacilities(responseData.total_facilities);
          // await this.countryService.loadCountries();
          // await this.drugService.loadDrugs(responseData.total_OPD_drugs);
          // await this.relationshipService.loadRelationships(responseData.total_relationships);
          // await this.wardService.loadWards();
          // await this.traditionalAuthorityService.loadTraditionalAuthorities(responseData.total_TA);
          // await this.villageService.loadVillages(responseData.total_village);
          // await this.testTypesService.loadTestTypes(responseData.total_test_types);
          // await this.testResultIndicatorService.loadIndicators();
          // await this.stockService.loadStock();
          // await this.diagnosisService.loadDiagnoses(responseData.total_diagnosis);
          // await this.specimenService.loadSpecimens(responseData.total_specimens)
    } catch (error) {
      this.logger.error(`${error}`);
    }

  }
}

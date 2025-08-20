// shared.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServerTimeService } from '../../app.serverTimeService';
import { AuthService } from '../../app.authService';
import { DDEService } from '../../modules/dde/ddde.service';
import { PatientService } from '../../modules/patient/patient.service';
import { UserService } from '../../modules/user/user.service';
import { ServerPatientCountService } from '../../modules/serverPatientCount/server-patient-count.service';

@Module({
    imports: [HttpModule], // <-- CORRECT: Only import HttpModule here.
    providers: [ServerTimeService, AuthService, DDEService, PatientService, UserService, ServerPatientCountService],
    exports: [ServerTimeService, AuthService, DDEService, PatientService, UserService, ServerPatientCountService],
})
export class SharedModule {}

export { ServerTimeService, AuthService, DDEService, PatientService, UserService, ServerPatientCountService };
interface PatientData {
    patientID: number;
    ID: string;
    personInformation: any;
    guardianInformation: {
        saved: any[];
        unsaved: any[];
    };
    birthRegistration?: any[];
    vitals: {
        saved: any[];
        unsaved: any[];
    };
    vaccineSchedule?: {
        vaccine_schedule: any[];
    };
    vaccineAdministration?: {
        orders: any[];
        obs: any[];
        voided: any[];
    };
    appointments?: {
        saved: any[];
        unsaved: any[];
    };
    diagnosis?: {
        saved: any[];
        unsaved: any[];
    };
    MedicationOrder?: {
        saved: any[];
        unsaved: any[];
    };
}
export declare function sophisticatedMergePatientData(existingData: PatientData, incomingData: PatientData): {
    mergedData: PatientData;
    hasChanges: boolean;
    changes: any[];
};
export {};

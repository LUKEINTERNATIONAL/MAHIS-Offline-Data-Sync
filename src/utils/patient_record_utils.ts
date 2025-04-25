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
    // Add other properties as needed
  }
  
  /**
   * Determines if incoming patient data contains new or updated information
   * compared to existing data for the same patient
   */
  function hasNewOrUpdatedData(existingData: PatientData, incomingData: PatientData): { 
    hasNewData: boolean; 
    changes: {
      section: string;
      type: 'new' | 'updated';
      details: any;
    }[]
  } {
    // First ensure we're comparing the same patient
    if (existingData.patientID !== incomingData.patientID) {
      throw new Error('Patient IDs do not match');
    }
  
    const changes: { section: string; type: 'new' | 'updated'; details: any; }[] = [];
    
    // Check top-level non-object properties
    const topLevelChanges = compareSimpleProperties(existingData, incomingData);
    if (topLevelChanges.length > 0) {
      changes.push(...topLevelChanges.map(prop => ({
        section: prop,
        type: 'updated',
        details: { old: existingData[prop], new: incomingData[prop] }
      })) as any);
    }
  
    // Check person information
    const personInfoChanges = compareObjects(
      existingData.personInformation, 
      incomingData.personInformation,
      'personInformation'
    );
    if (personInfoChanges.length > 0) {
      changes.push(...personInfoChanges);
    }
  
    // Check guardian information
    if (existingData.guardianInformation && incomingData.guardianInformation) {
      // Check saved guardians
      const savedGuardiansChanges = compareArrays(
        existingData.guardianInformation.saved || [],
        incomingData.guardianInformation.saved || [],
        'guardianInformation.saved'
      );
      if (savedGuardiansChanges.length > 0) {
        changes.push(...savedGuardiansChanges);
      }
  
      // Check unsaved guardians
      const unsavedGuardiansChanges = compareArrays(
        existingData.guardianInformation.unsaved || [],
        incomingData.guardianInformation.unsaved || [],
        'guardianInformation.unsaved'
      );
      if (unsavedGuardiansChanges.length > 0) {
        changes.push(...unsavedGuardiansChanges);
      }
    }
  
    // Check vitals
    if (existingData.vitals && incomingData.vitals) {
      // Check saved vitals
      const savedVitalsChanges = compareArrays(
        existingData.vitals.saved || [],
        incomingData.vitals.saved || [],
        'vitals.saved'
      );
      if (savedVitalsChanges.length > 0) {
        changes.push(...savedVitalsChanges);
      }
  
      // Check unsaved vitals
      const unsavedVitalsChanges = compareArrays(
        existingData.vitals.unsaved || [],
        incomingData.vitals.unsaved || [],
        'vitals.unsaved'
      );
      if (unsavedVitalsChanges.length > 0) {
        changes.push(...unsavedVitalsChanges);
      }
    }
  
    // Check birth registration data
    if (existingData.birthRegistration && incomingData.birthRegistration) {
      const birthRegChanges = compareArraysByConceptId(
        existingData.birthRegistration,
        incomingData.birthRegistration,
        'birthRegistration'
      );
      if (birthRegChanges.length > 0) {
        changes.push(...birthRegChanges);
      }
    }
  
    // Check vaccine schedule
    if (existingData.vaccineSchedule?.vaccine_schedule && incomingData.vaccineSchedule?.vaccine_schedule) {
      const vaccineScheduleChanges = compareVaccineSchedule(
        existingData.vaccineSchedule.vaccine_schedule,
        incomingData.vaccineSchedule.vaccine_schedule
      );
      if (vaccineScheduleChanges.length > 0) {
        changes.push(...vaccineScheduleChanges);
      }
    }
  
    // Check medication orders
    if (existingData.MedicationOrder && incomingData.MedicationOrder) {
      // Check saved medications
      const savedMedsChanges = compareArrays(
        existingData.MedicationOrder.saved || [],
        incomingData.MedicationOrder.saved || [],
        'MedicationOrder.saved'
      );
      if (savedMedsChanges.length > 0) {
        changes.push(...savedMedsChanges);
      }
  
      // Check unsaved medications
      const unsavedMedsChanges = compareMedicationOrders(
        existingData.MedicationOrder.unsaved || [],
        incomingData.MedicationOrder.unsaved || [],
        'MedicationOrder.unsaved'
      );
      if (unsavedMedsChanges.length > 0) {
        changes.push(...unsavedMedsChanges);
      }
    }
  
    // Check diagnosis
    if (existingData.diagnosis && incomingData.diagnosis) {
      // Check saved diagnosis
      const savedDiagnosisChanges = compareArraysByObsId(
        existingData.diagnosis.saved || [],
        incomingData.diagnosis.saved || [],
        'diagnosis.saved'
      );
      if (savedDiagnosisChanges.length > 0) {
        changes.push(...savedDiagnosisChanges);
      }
  
      // Check unsaved diagnosis
      const unsavedDiagnosisChanges = compareArrays(
        existingData.diagnosis.unsaved || [],
        incomingData.diagnosis.unsaved || [],
        'diagnosis.unsaved'
      );
      if (unsavedDiagnosisChanges.length > 0) {
        changes.push(...unsavedDiagnosisChanges);
      }
    }
  
    // Add similar checks for other nested structures
    // ...
  
    return {
      hasNewData: changes.length > 0,
      changes
    };
  }
  
  // Helper function to compare simple properties
  function compareSimpleProperties(obj1: any, obj2: any): string[] {
    const changes: string[] = [];
    
    for (const key in obj1) {
      // Skip objects and arrays as they'll be handled separately
      if (obj1[key] !== null && 
          typeof obj1[key] !== 'object' && 
          key in obj2 && 
          obj1[key] !== obj2[key]) {
        changes.push(key);
      }
    }
    
    return changes;
  }
  
  // Helper function to compare objects
  function compareObjects(obj1: any, obj2: any, section: string): any[] {
    const changes: any[] = [];
    
    if (!obj1 || !obj2) {
      return obj1 !== obj2 ? [{ section, type: 'updated', details: { old: obj1, new: obj2 } }] : [];
    }
    
    for (const key in obj2) {
      if (!(key in obj1)) {
        changes.push({
          section: `${section}.${key}`,
          type: 'new',
          details: { new: obj2[key] }
        });
      } else if (typeof obj2[key] !== 'object') {
        if (obj1[key] !== obj2[key]) {
          changes.push({
            section: `${section}.${key}`,
            type: 'updated',
            details: { old: obj1[key], new: obj2[key] }
          });
        }
      } else if (obj2[key] !== null) {
        // Recursively compare nested objects
        const nestedChanges = compareObjects(obj1[key], obj2[key], `${section}.${key}`);
        if (nestedChanges.length > 0) {
          changes.push(...nestedChanges);
        }
      }
    }
    
    return changes;
  }
  
  // Helper function to compare arrays
  function compareArrays(arr1: any[], arr2: any[], section: string): any[] {
    const changes: any[] = [];
    
    // Check for new items
    if (arr2.length > arr1.length) {
      changes.push({
        section,
        type: 'new',
        details: { newItems: arr2.slice(arr1.length) }
      });
    }
  
    // Check for updated items
    const minLength = Math.min(arr1.length, arr2.length);
    for (let i = 0; i < minLength; i++) {
      if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) {
        changes.push({
          section: `${section}[${i}]`,
          type: 'updated',
          details: { old: arr1[i], new: arr2[i] }
        });
      }
    }
    
    return changes;
  }
  
  // Helper function for comparing arrays where items have concept_id
  function compareArraysByConceptId(arr1: any[], arr2: any[], section: string): any[] {
    const changes: any[] = [];
    const arr1Map = new Map(arr1.map(item => [item.concept_id, item]));
    
    // Check for new or updated items
    for (const item of arr2) {
      if (!arr1Map.has(item.concept_id)) {
        changes.push({
          section: `${section}`,
          type: 'new',
          details: { newItem: item }
        });
      } else {
        const existingItem = arr1Map.get(item.concept_id);
        if (JSON.stringify(existingItem) !== JSON.stringify(item)) {
          changes.push({
            section: `${section} (concept_id: ${item.concept_id})`,
            type: 'updated',
            details: { old: existingItem, new: item }
          });
        }
      }
    }
    
    return changes;
  }
  
  // Helper function for comparing arrays where items have obs_id
  function compareArraysByObsId(arr1: any[], arr2: any[], section: string): any[] {
    const changes: any[] = [];
    const arr1Map = new Map(arr1.map(item => [item.obs_id, item]));
    
    // Check for new or updated items
    for (const item of arr2) {
      if (!arr1Map.has(item.obs_id)) {
        changes.push({
          section: `${section}`,
          type: 'new',
          details: { newItem: item }
        });
      } else {
        const existingItem = arr1Map.get(item.obs_id);
        if (JSON.stringify(existingItem) !== JSON.stringify(item)) {
          changes.push({
            section: `${section} (obs_id: ${item.obs_id})`,
            type: 'updated',
            details: { old: existingItem, new: item }
          });
        }
      }
    }
    
    return changes;
  }
  
  // Helper function to compare vaccine schedules
  function compareVaccineSchedule(schedule1: any[], schedule2: any[]): any[] {
    const changes: any[] = [];
    
    if (schedule1.length !== schedule2.length) {
      changes.push({
        section: 'vaccineSchedule.vaccine_schedule',
        type: 'updated',
        details: { message: 'Schedule length differs' }
      });
      return changes;
    }
    
    for (let i = 0; i < schedule1.length; i++) {
      const visit1 = schedule1[i];
      const visit2 = schedule2[i];
      
      // Check visit properties
      if (visit1.milestone_status !== visit2.milestone_status) {
        changes.push({
          section: `vaccineSchedule.vaccine_schedule[${i}]`,
          type: 'updated',
          details: { 
            property: 'milestone_status', 
            old: visit1.milestone_status, 
            new: visit2.milestone_status 
          }
        });
      }
      
      // Check antigens
      for (let j = 0; j < visit2.antigens.length; j++) {
        const antigen1 = visit1.antigens[j];
        const antigen2 = visit2.antigens[j];
        
        if (antigen1.status !== antigen2.status) {
          changes.push({
            section: `vaccineSchedule.vaccine_schedule[${i}].antigens[${j}]`,
            type: 'updated',
            details: { 
              drug_id: antigen2.drug_id,
              drug_name: antigen2.drug_name,
              property: 'status',
              old: antigen1.status,
              new: antigen2.status
            }
          });
        }
        
        if (antigen2.date_administered && antigen1.date_administered !== antigen2.date_administered) {
          changes.push({
            section: `vaccineSchedule.vaccine_schedule[${i}].antigens[${j}]`,
            type: 'updated',
            details: { 
              drug_id: antigen2.drug_id,
              drug_name: antigen2.drug_name,
              property: 'date_administered',
              old: antigen1.date_administered,
              new: antigen2.date_administered
            }
          });
        }
      }
    }
    
    return changes;
  }
  
  // Helper function to compare medication orders which might have NCD_Drug_Orders
  function compareMedicationOrders(orders1: any[], orders2: any[], section: string): any[] {
    const changes: any[] = [];
    
    // Compare arrays length
    if (orders1.length !== orders2.length) {
      changes.push({
        section,
        type: 'updated',
        details: { message: 'Medication orders count differs' }
      });
    }
    
    // For each order in the incoming data
    for (let i = 0; i < orders2.length; i++) {
      const existingOrder = i < orders1.length ? orders1[i] : null;
      const incomingOrder = orders2[i];
      
      // If no existing order, mark as new
      if (!existingOrder) {
        changes.push({
          section: `${section}[${i}]`,
          type: 'new',
          details: { newOrder: incomingOrder }
        });
        continue;
      }
      
      // Check NCD_Drug_Orders if they exist
      if (incomingOrder.NCD_Drug_Orders && existingOrder.NCD_Drug_Orders) {
        const existingDrugs = new Map(
          existingOrder.NCD_Drug_Orders.map(drug => [drug.drug_inventory_id, drug])
        );
        
        for (const drug of incomingOrder.NCD_Drug_Orders) {
          if (!existingDrugs.has(drug.drug_inventory_id)) {
            changes.push({
              section: `${section}[${i}].NCD_Drug_Orders`,
              type: 'new',
              details: { 
                drug_inventory_id: drug.drug_inventory_id,
                details: drug
              }
            });
          } else {
            const existingDrug = existingDrugs.get(drug.drug_inventory_id);
            if (JSON.stringify(existingDrug) !== JSON.stringify(drug)) {
              changes.push({
                section: `${section}[${i}].NCD_Drug_Orders`,
                type: 'updated',
                details: { 
                  drug_inventory_id: drug.drug_inventory_id,
                  old: existingDrug,
                  new: drug
                }
              });
            }
          }
        }
      } else if (incomingOrder.NCD_Drug_Orders) {
        changes.push({
          section: `${section}[${i}]`,
          type: 'new',
          details: { newNCD_Drug_Orders: incomingOrder.NCD_Drug_Orders }
        });
      }
    }
    
    return changes;
  }
  
  // Usage example
  function updatePatientData(existingData: PatientData, incomingData: PatientData): PatientData {
    // First check if there are changes
    const { hasNewData, changes } = hasNewOrUpdatedData(existingData, incomingData);
    
    if (!hasNewData) {
      console.log('No changes detected');
      return existingData;
    }
    
    console.log('Changes detected:', changes);
    
    // Apply the changes (in a real implementation, you'd want to be more careful about merging)
    return { ...existingData, ...incomingData };
  }
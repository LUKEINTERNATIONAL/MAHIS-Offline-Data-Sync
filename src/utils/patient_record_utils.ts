import { normalizeDate, createMedicationKey, deduplicateNcdDrugOrders} from './medication_order_utils'

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
  function hasChanges(existingData: PatientData, incomingData: PatientData): { 
    hasChanges: boolean;
    changes: any[];
  } {
    // First check if there are changes
    const { hasNewData, changes } = hasNewOrUpdatedData(existingData, incomingData);
    
    if (!hasNewData) {
      console.log('No changes detected');
      return { hasChanges: false, changes: [] };
    }
    
    console.log(`Changes detected: ${existingData.patientID}`, changes);
    return { hasChanges: true, changes };
  }

  /**
 * Performs a sophisticated deep merge of patient data objects
 * that intelligently handles nested structures, arrays, and special medical data
 * with improved handling of saved/unsaved relationships
 */
export function sophisticatedMergePatientData(existingData: PatientData, incomingData: PatientData): { 
  mergedData: PatientData;
  hasChanges: boolean;
  changes: any[];
} {
  // Ensure we're working with the same patient
  if (existingData.patientID !== incomingData.patientID) {
    throw new Error('Cannot merge data for different patients');
  }

  // Check for changes first
  const changeResult = hasChanges(existingData, incomingData);
  if (!changeResult.hasChanges) {
    return { 
      mergedData: existingData,
      hasChanges: false,
      changes: [] 
    }; 
  }

  // Log what changes were detected
  console.log('Merging the following changes:', changeResult.changes);

  // Create a deep clone of the existing data as our starting point
  const mergedData = JSON.parse(JSON.stringify(existingData)) as PatientData;

  // Merge top-level primitive properties
  for (const key in incomingData) {
    if (typeof incomingData[key] !== 'object' || incomingData[key] === null) {
      mergedData[key] = incomingData[key];
    }
  }

  // Merge person information
  if (incomingData.personInformation) {
    mergedData.personInformation = mergeObjects(
      mergedData.personInformation || {},
      incomingData.personInformation
    );
  }

  // Merge guardian information with improved saved/unsaved handling
  if (incomingData.guardianInformation) {
    mergedData.guardianInformation = mergedData.guardianInformation || { saved: [], unsaved: [] };
    
    // First merge saved guardians by relationship_id
    if (incomingData.guardianInformation.saved) {
      mergedData.guardianInformation.saved = mergeArraysById(
        mergedData.guardianInformation.saved || [],
        incomingData.guardianInformation.saved,
        'relationship_id'
      );
      
      // Now handle transition from unsaved to saved
      if (mergedData.guardianInformation.unsaved && mergedData.guardianInformation.unsaved.length > 0) {
        // Filter out any unsaved items that now appear in saved
        mergedData.guardianInformation.unsaved = mergedData.guardianInformation.unsaved.filter(unsavedItem => {
          // Keep only items that don't have matching relationship_id in saved collection
          return !mergedData.guardianInformation.saved.some(
            savedItem => savedItem.relationship_id === unsavedItem.relationship_id
          );
        });
      }
    }
    
    // Now add any new unsaved items from incoming data
    if (incomingData.guardianInformation.unsaved && incomingData.guardianInformation.unsaved.length > 0) {
      // Create a set of existing unsaved item IDs for quick lookup
      const existingUnsavedIds = new Set(
        mergedData.guardianInformation.unsaved.map(item => item.relationship_id)
      );
      
      // Add only new unsaved items
      incomingData.guardianInformation.unsaved.forEach(unsavedItem => {
        // If no ID or ID doesn't exist in our current unsaved collection, add it
        if (!unsavedItem.relationship_id || !existingUnsavedIds.has(unsavedItem.relationship_id)) {
          mergedData.guardianInformation.unsaved.push(unsavedItem);
        } else {
          // Update existing unsaved item
          const index = mergedData.guardianInformation.unsaved.findIndex(
            item => item.relationship_id === unsavedItem.relationship_id
          );
          mergedData.guardianInformation.unsaved[index] = unsavedItem;
        }
      });
    }
  }

  // Merge birth registration data
  if (incomingData.birthRegistration) {
    mergedData.birthRegistration = mergeArraysById(
      mergedData.birthRegistration || [],
      incomingData.birthRegistration,
      'concept_id'
    );
  }

  // Merge vitals with improved saved/unsaved handling
  if (incomingData.vitals) {
    mergedData.vitals = mergedData.vitals || { saved: [], unsaved: [] };
    
    // First merge saved vitals 
    if (incomingData.vitals.saved) {
      mergedData.vitals.saved = mergeVitalsData(
        mergedData.vitals.saved || [],
        incomingData.vitals.saved
      );
      
      // Handle transition from unsaved to saved
      if (mergedData.vitals.unsaved && mergedData.vitals.unsaved.length > 0) {
        // Determine ID field to use
        const idField = incomingData.vitals.saved.some(item => 'obs_id' in item) 
          ? 'obs_id' 
          : 'concept_id';
        
        // Keep only unsaved items that don't appear in saved collection
        mergedData.vitals.unsaved = mergedData.vitals.unsaved.filter(unsavedItem => {
          return !mergedData.vitals.saved.some(savedItem => {
            // If using concept_id, also check datetime for more accurate matching
            if (idField === 'concept_id' && unsavedItem.concept_id === savedItem.concept_id) {
              return unsavedItem.obs_datetime === savedItem.obs_datetime;
            }
            return savedItem[idField] === unsavedItem[idField];
          });
        });
      }
    }
    
    // Now handle incoming unsaved vitals
    if (incomingData.vitals.unsaved && incomingData.vitals.unsaved.length > 0) {
      const idField = incomingData.vitals.unsaved.some(item => 'obs_id' in item) 
        ? 'obs_id' 
        : 'concept_id';
      
      // Create maps for quick lookups
      const existingUnsavedMap = new Map();
      mergedData.vitals.unsaved.forEach(item => {
        if (idField === 'concept_id' && item.obs_datetime) {
          existingUnsavedMap.set(`${item.concept_id}-${item.obs_datetime}`, item);
        } else if (item[idField]) {
          existingUnsavedMap.set(item[idField], item);
        }
      });
      
      // Add or update unsaved items
      incomingData.vitals.unsaved.forEach(item => {
        let key;
        if (idField === 'concept_id' && item.obs_datetime) {
          key = `${item.concept_id}-${item.obs_datetime}`;
        } else {
          key = item[idField];
        }
        
        if (!key || !existingUnsavedMap.has(key)) {
          // Add new unsaved item
          mergedData.vitals.unsaved.push(item);
        } else {
          // Update existing unsaved item
          const index = mergedData.vitals.unsaved.findIndex(unsavedItem => {
            if (idField === 'concept_id' && item.obs_datetime) {
              return unsavedItem.concept_id === item.concept_id && 
                     unsavedItem.obs_datetime === item.obs_datetime;
            }
            return unsavedItem[idField] === item[idField];
          });
          mergedData.vitals.unsaved[index] = item;
        }
      });
    }
  }

  // Merge vaccine schedule
  if (incomingData.vaccineSchedule?.vaccine_schedule) {
    mergedData.vaccineSchedule = mergedData.vaccineSchedule || { vaccine_schedule: [] };
    mergedData.vaccineSchedule.vaccine_schedule = mergeVaccineSchedule(
      mergedData.vaccineSchedule.vaccine_schedule,
      incomingData.vaccineSchedule.vaccine_schedule
    );
  }

  // Merge vaccine administration with improved saved/unsaved handling
  if (incomingData.vaccineAdministration) {
    mergedData.vaccineAdministration = mergedData.vaccineAdministration || { orders: [], obs: [], voided: [] };
    
    // Merge orders by order_id
    if (incomingData.vaccineAdministration.orders) {
      mergedData.vaccineAdministration.orders = mergeArraysById(
        mergedData.vaccineAdministration.orders,
        incomingData.vaccineAdministration.orders,
        'order_id'
      );
    }
    
    // Merge obs by obs_id
    if (incomingData.vaccineAdministration.obs) {
      mergedData.vaccineAdministration.obs = mergeArraysById(
        mergedData.vaccineAdministration.obs,
        incomingData.vaccineAdministration.obs,
        'obs_id'
      );
    }
    
    // Handle voided items with deduplication
    if (incomingData.vaccineAdministration.voided) {
      // Create a set of existing voided IDs for quick lookup
      const existingVoidedSet = new Set(mergedData.vaccineAdministration.voided);
      
      // Add only new voided items to avoid duplicates
      incomingData.vaccineAdministration.voided.forEach(voidedItem => {
        if (!existingVoidedSet.has(voidedItem)) {
          mergedData.vaccineAdministration.voided.push(voidedItem);
          existingVoidedSet.add(voidedItem);
        }
      });
    }
  }

  // Merge appointments with improved saved/unsaved handling
  if (incomingData.appointments) {
    mergedData.appointments = mergedData.appointments || { saved: [], unsaved: [] };
    
    // First handle saved appointments
    if (incomingData.appointments.saved) {
      mergedData.appointments.saved = mergeAppointments(
        mergedData.appointments.saved,
        incomingData.appointments.saved
      );
      
      // Handle transition from unsaved to saved
      if (mergedData.appointments.unsaved && mergedData.appointments.unsaved.length > 0) {
        // Determine matching criteria
        const hasObsId = incomingData.appointments.saved.some(item => 'obs_id' in item);
        
        // Filter out any unsaved appointments that now appear in saved
        mergedData.appointments.unsaved = mergedData.appointments.unsaved.filter(unsavedItem => {
          return !mergedData.appointments.saved.some(savedItem => {
            if (hasObsId && savedItem.obs_id && unsavedItem.obs_id) {
              return savedItem.obs_id === unsavedItem.obs_id;
            }
            // Match by concept_id and value_datetime
            return savedItem.concept_id === unsavedItem.concept_id && 
                   savedItem.value_datetime === unsavedItem.value_datetime;
          });
        });
      }
    }
    
    // Now handle unsaved appointments
    if (incomingData.appointments.unsaved && incomingData.appointments.unsaved.length > 0) {
      const hasObsId = incomingData.appointments.unsaved.some(item => 'obs_id' in item);
      
      // Create maps for quick lookups
      const existingUnsavedMap = new Map();
      mergedData.appointments.unsaved.forEach(item => {
        if (hasObsId && item.obs_id) {
          existingUnsavedMap.set(item.obs_id, item);
        } else if (item.concept_id && item.value_datetime) {
          existingUnsavedMap.set(`${item.concept_id}-${item.value_datetime}`, item);
        }
      });
      
      // Add or update unsaved appointments
      incomingData.appointments.unsaved.forEach(item => {
        let key;
        if (hasObsId && item.obs_id) {
          key = item.obs_id;
        } else if (item.concept_id && item.value_datetime) {
          key = `${item.concept_id}-${item.value_datetime}`;
        }
        
        if (!key || !existingUnsavedMap.has(key)) {
          // Add new unsaved appointment
          mergedData.appointments.unsaved.push(item);
        } else {
          // Update existing unsaved appointment
          const index = mergedData.appointments.unsaved.findIndex(unsavedItem => {
            if (hasObsId && item.obs_id) {
              return unsavedItem.obs_id === item.obs_id;
            }
            return unsavedItem.concept_id === item.concept_id && 
                   unsavedItem.value_datetime === item.value_datetime;
          });
          mergedData.appointments.unsaved[index] = item;
        }
      });
    }
  }

  // Merge diagnosis with improved saved/unsaved handling
  if (incomingData.diagnosis) {
    mergedData.diagnosis = mergedData.diagnosis || { saved: [], unsaved: [] };
    
    // First handle saved diagnoses
    if (incomingData.diagnosis.saved) {
      mergedData.diagnosis.saved = mergeArraysById(
        mergedData.diagnosis.saved,
        incomingData.diagnosis.saved,
        'obs_id'
      );
      
      // Handle transition from unsaved to saved
      if (mergedData.diagnosis.unsaved && mergedData.diagnosis.unsaved.length > 0) {
        // Filter out unsaved diagnoses that now appear in saved
        mergedData.diagnosis.unsaved = mergedData.diagnosis.unsaved.filter(unsavedItem => {
          // If the unsaved item has an obs_id, check if it's now in saved
          if (unsavedItem.obs_id) {
            return !mergedData.diagnosis.saved.some(
              savedItem => savedItem.obs_id === unsavedItem.obs_id
            );
          }
          return true; // Keep items without obs_id
        });
      }
    }
    
    // Now handle incoming unsaved diagnoses
    if (incomingData.diagnosis.unsaved && incomingData.diagnosis.unsaved.length > 0) {
      // Create map of existing unsaved diagnoses
      const existingUnsavedMap = new Map();
      mergedData.diagnosis.unsaved.forEach(item => {
        if (item.obs_id) {
          existingUnsavedMap.set(item.obs_id, item);
        } else if (item.concept_id && item.obs_datetime) {
          existingUnsavedMap.set(`${item.concept_id}-${item.obs_datetime}`, item);
        }
      });
      
      // Add or update unsaved diagnoses
      incomingData.diagnosis.unsaved.forEach(item => {
        let key;
        if (item.obs_id) {
          key = item.obs_id;
        } else if (item.concept_id && item.obs_datetime) {
          key = `${item.concept_id}-${item.obs_datetime}`;
        }
        
        if (!key || !existingUnsavedMap.has(key)) {
          // Add new unsaved diagnosis
          mergedData.diagnosis.unsaved.push(item);
        } else {
          // Update existing unsaved diagnosis
          const index = mergedData.diagnosis.unsaved.findIndex(unsavedItem => {
            if (item.obs_id) {
              return unsavedItem.obs_id === item.obs_id;
            }
            return unsavedItem.concept_id === item.concept_id && 
                   unsavedItem.obs_datetime === item.obs_datetime;
          });
          mergedData.diagnosis.unsaved[index] = item;
        }
      });
    }
  }

  // Merge medication orders with improved saved/unsaved handling
  if (incomingData.MedicationOrder) {
    mergedData.MedicationOrder = mergedData.MedicationOrder || { saved: [], unsaved: [] };
    
    // First handle saved medication orders
    if (incomingData.MedicationOrder.saved) {
      mergedData.MedicationOrder.saved = mergeArraysById(
        mergedData.MedicationOrder.saved,
        incomingData.MedicationOrder.saved,
        'order_id'
      );
    }
    
    // Handle unsaved medication orders with NCD_Drug_Orders deduplication
    if (incomingData.MedicationOrder.unsaved?.length > 0) {
      const savedMedications = mergedData.MedicationOrder.saved || [];
      
      // Find NCD_Drug_Orders section
      const ncdSectionIndex = incomingData.MedicationOrder.unsaved.findIndex(
        item => item.NCD_Drug_Orders?.length > 0
      );
      
      if (ncdSectionIndex >= 0) {
        const ncdSection = incomingData.MedicationOrder.unsaved[ncdSectionIndex];
        
        // Deduplicate NCD_Drug_Orders against saved medications
        const deduplicatedNcdOrders = deduplicateNcdDrugOrders(
          savedMedications,
          ncdSection.NCD_Drug_Orders
        );
        
        if (deduplicatedNcdOrders.length > 0) {
          // Find existing NCD section in merged data
          const existingNcdIndex = mergedData.MedicationOrder.unsaved.findIndex(
            item => item.NCD_Drug_Orders?.length > 0
          );
          
          if (existingNcdIndex >= 0) {
            // Update existing section
            mergedData.MedicationOrder.unsaved[existingNcdIndex].NCD_Drug_Orders = 
              deduplicatedNcdOrders;
          } else {
            // Add new section with deduplicated orders
            mergedData.MedicationOrder.unsaved.push({
              ...ncdSection,
              NCD_Drug_Orders: deduplicatedNcdOrders
            });
          }
        }
        
        // Remove processed NCD section from incoming data
        incomingData.MedicationOrder.unsaved = incomingData.MedicationOrder.unsaved
          .filter((_, index) => index !== ncdSectionIndex);
      }
      
      // Handle remaining regular medication orders
      const remainingOrders = incomingData.MedicationOrder.unsaved
        .filter(order => !order.NCD_Drug_Orders)
        .filter(order => {
          if (!order.order_id || !order.drug_id) return true;
          
          // Deduplicate against saved medications
          const key = createMedicationKey(order.drug_id, order.start_date);
          return !savedMedications.some(saved => 
            createMedicationKey(saved.drug_id, saved.start_date) === key
          );
        });
      
      // Add remaining deduplicated orders
      mergedData.MedicationOrder.unsaved.push(...remainingOrders);
    }
  }

  // Additional sections could be handled similarly with improved saved/unsaved handling
  // ...

  return {
    mergedData,
    hasChanges: true,
    changes: changeResult.changes
  };
}

/**
 * Merges two objects recursively
 */
function mergeObjects(obj1: any, obj2: any): any {
  const result = { ...obj1 };
  
  for (const key in obj2) {
    // If property doesn't exist in obj1, add it
    if (!(key in result)) {
      result[key] = obj2[key];
    } 
    // If both are objects, merge them recursively
    else if (
      obj2[key] !== null && 
      typeof obj2[key] === 'object' && 
      !Array.isArray(obj2[key]) &&
      result[key] !== null && 
      typeof result[key] === 'object' && 
      !Array.isArray(result[key])
    ) {
      result[key] = mergeObjects(result[key], obj2[key]);
    }
    // Otherwise replace with obj2's value
    else {
      result[key] = obj2[key];
    }
  }
  
  return result;
}

/**
 * Merges two arrays of objects based on a specified ID field
 */
function mergeArraysById(arr1: any[], arr2: any[], idField: string): any[] {
  if (!arr1 || arr1.length === 0) return [...arr2];
  if (!arr2 || arr2.length === 0) return [...arr1];
  
  const result = [...arr1];
  const idMap = new Map(result.map(item => [item[idField], item]));
  
  for (const item of arr2) {
    const id = item[idField];
    
    if (id === undefined) {
      // If no ID field, just add to the result
      result.push(item);
    } else if (!idMap.has(id)) {
      // If ID doesn't exist in result, add it
      result.push(item);
      idMap.set(id, item);
    } else {
      // If ID exists, update the existing item
      const existingItem = idMap.get(id);
      const index = result.findIndex(r => r[idField] === id);
      
      // If objects, merge them, otherwise replace
      if (typeof item === 'object' && typeof existingItem === 'object') {
        result[index] = mergeObjects(existingItem, item);
      } else {
        result[index] = item;
      }
    }
  }
  
  return result;
}

/**
 * Merges vitals data with special handling for obs_datetime
 */
function mergeVitalsData(existing: any[], incoming: any[]): any[] {
  // First try to merge by obs_id if available
  if (incoming.some(item => 'obs_id' in item)) {
    return mergeArraysById(existing, incoming, 'obs_id');
  }
  
  // If no obs_id, try to match by concept_id and obs_datetime
  const result = [...existing];
  
  for (const item of incoming) {
    if (!item.concept_id || !item.obs_datetime) {
      result.push(item);
      continue;
    }
    
    // Try to find matching item
    const index = result.findIndex(
      r => r.concept_id === item.concept_id && r.obs_datetime === item.obs_datetime
    );
    
    if (index >= 0) {
      // Update existing item
      result[index] = { ...result[index], ...item };
    } else {
      // Add new item
      result.push(item);
    }
  }
  
  return result;
}

/**
 * Merges vaccine schedules with special handling for visits and antigens
 */
function mergeVaccineSchedule(existing: any[], incoming: any[]): any[] {
  if (!existing || existing.length === 0) return [...incoming];
  if (!incoming || incoming.length === 0) return [...existing];
  
  // Create a map of existing visits by visit number
  const visitMap = new Map(existing.map(visit => [visit.visit, visit]));
  const result = [...existing];
  
  for (const incomingVisit of incoming) {
    if (!visitMap.has(incomingVisit.visit)) {
      // This is a new visit
      result.push(incomingVisit);
      continue;
    }
    
    // Get the existing visit
    const existingVisit = visitMap.get(incomingVisit.visit);
    const visitIndex = result.findIndex(v => v.visit === incomingVisit.visit);
    
    // Update milestone status if changed
    if (incomingVisit.milestone_status !== existingVisit.milestone_status) {
      result[visitIndex].milestone_status = incomingVisit.milestone_status;
    }
    
    // Merge antigens
    if (incomingVisit.antigens && incomingVisit.antigens.length > 0) {
      // Create a map of existing antigens by drug_id
      const antigenMap = new Map(existingVisit.antigens.map(a => [a.drug_id, a]));
      
      for (const incomingAntigen of incomingVisit.antigens) {
        if (!antigenMap.has(incomingAntigen.drug_id)) {
          // New antigen
          result[visitIndex].antigens.push(incomingAntigen);
        } else {
          // Update existing antigen
          const antigenIndex = result[visitIndex].antigens.findIndex(
            a => a.drug_id === incomingAntigen.drug_id
          );
          
          // Only update if status changed or date_administered added/changed
          const existingAntigen = result[visitIndex].antigens[antigenIndex];
          if (
            incomingAntigen.status !== existingAntigen.status || 
            incomingAntigen.date_administered !== existingAntigen.date_administered ||
            incomingAntigen.can_administer !== existingAntigen.can_administer
          ) {
            result[visitIndex].antigens[antigenIndex] = {
              ...existingAntigen,
              status: incomingAntigen.status,
              can_administer: incomingAntigen.can_administer,
              date_administered: incomingAntigen.date_administered,
              administered_by: incomingAntigen.administered_by,
              vaccine_batch_number: incomingAntigen.vaccine_batch_number,
              encounter_id: incomingAntigen.encounter_id,
              order_id: incomingAntigen.order_id
            };
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Merges appointment data based on concept_id and value_datetime
 */
function mergeAppointments(existing: any[], incoming: any[]): any[] {
  // First try to merge by obs_id if available
  if (incoming.some(item => 'obs_id' in item)) {
    return mergeArraysById(existing, incoming, 'obs_id');
  }
  
  // If no obs_id, try to match by concept_id and value_datetime
  const result = [...existing];
  
  for (const item of incoming) {
    if (!item.concept_id || !item.value_datetime) {
      result.push(item);
      continue;
    }
    
    // Try to find matching appointment
    const index = result.findIndex(
      r => r.concept_id === item.concept_id && r.value_datetime === item.value_datetime
    );
    
    if (index >= 0) {
      // Update existing appointment
      result[index] = { ...result[index], ...item };
    } else {
      // Add new appointment
      result.push(item);
    }
  }
  
  return result;
}

/**
 * Merges NCD drug orders by drug_inventory_id
 */
function mergeNcdDrugOrders(existing: any[], incoming: any[]): any[] {
  const result = [...existing];
  const drugMap = new Map(result.map(drug => [drug.drug_inventory_id, drug]));
  
  for (const drug of incoming) {
    if (!drugMap.has(drug.drug_inventory_id)) {
      // New drug order
      result.push(drug);
    } else {
      // Update existing drug order
      const index = result.findIndex(d => d.drug_inventory_id === drug.drug_inventory_id);
      result[index] = { ...result[index], ...drug };
    }
  }
  
  return result;
}
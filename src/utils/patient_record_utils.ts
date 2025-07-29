import { normalizeDate, createMedicationKey, deduplicateNcdDrugOrders} from './medication_order_utils'

interface PatientData {
    patientID: any;
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
    [key: string]: any; // Allow for other properties with any type
}

/**
 * Determines if incoming patient data contains new or updated information
 * compared to existing data for the same patient
 */
function hasNewOrUpdatedData(existingData: PatientData, incomingData: PatientData): {
  hasNewData: boolean;
  changes: {
    section: string;
    type: 'new' | 'updated' | 'removed'; // Added 'removed' type
    details: any;
  }[]
} {
  const changes: { section: string; type: 'new' | 'updated' | 'removed'; details: any; }[] = [];

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
  if (existingData.guardianInformation || incomingData.guardianInformation) {
    // Check saved guardians
    const savedGuardiansChanges = compareArrays(
      existingData.guardianInformation?.saved || [],
      incomingData.guardianInformation?.saved || [],
      'guardianInformation.saved'
    );
    if (savedGuardiansChanges.length > 0) {
      changes.push(...savedGuardiansChanges);
    }

    // Check unsaved guardians
    const unsavedGuardiansChanges = compareArrays(
      existingData.guardianInformation?.unsaved || [],
      incomingData.guardianInformation?.unsaved || [],
      'guardianInformation.unsaved'
    );
    if (unsavedGuardiansChanges.length > 0) {
      changes.push(...unsavedGuardiansChanges);
    }
  }

  // Check vitals
  if (existingData.vitals || incomingData.vitals) {
    // Check saved vitals
    const savedVitalsChanges = compareArrays( // Using generic compareArrays for vitals for simplicity here.
      existingData.vitals?.saved || [],
      incomingData.vitals?.saved || [],
      'vitals.saved'
    );
    if (savedVitalsChanges.length > 0) {
      changes.push(...savedVitalsChanges);
    }

    // Check unsaved vitals
    const unsavedVitalsChanges = compareArrays(
      existingData.vitals?.unsaved || [],
      incomingData.vitals?.unsaved || [],
      'vitals.unsaved'
    );
    if (unsavedVitalsChanges.length > 0) {
      changes.push(...unsavedVitalsChanges);
    }
  }

  // Check vaccine schedule
  if (existingData.vaccineSchedule?.vaccine_schedule || incomingData.vaccineSchedule?.vaccine_schedule) {
    const vaccineScheduleChanges = compareVaccineSchedule(
      existingData.vaccineSchedule?.vaccine_schedule || [],
      incomingData.vaccineSchedule?.vaccine_schedule || []
    );
    if (vaccineScheduleChanges.length > 0) {
      changes.push(...vaccineScheduleChanges);
    }
  }

  // Check medication orders
  if (existingData.MedicationOrder || incomingData.MedicationOrder) {
    // Check saved medications
    const savedMedsChanges = compareArrays(
      existingData.MedicationOrder?.saved || [],
      incomingData.MedicationOrder?.saved || [],
      'MedicationOrder.saved'
    );
    if (savedMedsChanges.length > 0) {
      changes.push(...savedMedsChanges);
    }

    // Check unsaved medications
    const unsavedMedsChanges = compareMedicationOrders( // This is a specialized comparison
      existingData.MedicationOrder?.unsaved || [],
      incomingData.MedicationOrder?.unsaved || [],
      'MedicationOrder.unsaved'
    );
    if (unsavedMedsChanges.length > 0) {
      changes.push(...unsavedMedsChanges);
    }
  }

  // Check diagnosis
  if (existingData.diagnosis || incomingData.diagnosis) {
    // Check saved diagnosis
    const savedDiagnosisChanges = compareArraysByObsId(
      existingData.diagnosis?.saved || [],
      incomingData.diagnosis?.saved || [],
      'diagnosis.saved'
    );
    if (savedDiagnosisChanges.length > 0) {
      changes.push(...savedDiagnosisChanges);
    }

    // Check unsaved diagnosis
    const unsavedDiagnosisChanges = compareArrays(
      existingData.diagnosis?.unsaved || [],
      incomingData.diagnosis?.unsaved || [],
      'diagnosis.unsaved'
    );
    if (unsavedDiagnosisChanges.length > 0) {
      changes.push(...unsavedDiagnosisChanges);
    }
  }

  // Check vaccine administration
  if (existingData.vaccineAdministration || incomingData.vaccineAdministration) {
      const ordersChanges = compareArrays(
          existingData.vaccineAdministration?.orders || [],
          incomingData.vaccineAdministration?.orders || [],
          'vaccineAdministration.orders'
      );
      if (ordersChanges.length > 0) {
          changes.push(...ordersChanges);
      }
      const obsChanges = compareArrays(
          existingData.vaccineAdministration?.obs || [],
          incomingData.vaccineAdministration?.obs || [],
          'vaccineAdministration.obs'
      );
      if (obsChanges.length > 0) {
          changes.push(...obsChanges);
      }
      const voidedChanges = compareArrays(
          existingData.vaccineAdministration?.voided || [],
          incomingData.vaccineAdministration?.voided || [],
          'vaccineAdministration.voided'
      );
      if (voidedChanges.length > 0) {
          changes.push(...voidedChanges);
      }
  }

  // Check appointments
  if (existingData.appointments || incomingData.appointments) {
    const savedAppointmentsChanges = compareArrays( // Using generic compareArrays for appointments for simplicity
      existingData.appointments?.saved || [],
      incomingData.appointments?.saved || [],
      'appointments.saved'
    );
    if (savedAppointmentsChanges.length > 0) {
      changes.push(...savedAppointmentsChanges);
    }
    const unsavedAppointmentsChanges = compareArrays(
      existingData.appointments?.unsaved || [],
      incomingData.appointments?.unsaved || [],
      'appointments.unsaved'
    );
    if (unsavedAppointmentsChanges.length > 0) {
      changes.push(...unsavedAppointmentsChanges);
    }
  }


  // --- CATCH-ALL GENERIC CHECKS FOR OTHER SECTIONS ---
  // Iterate through all keys in incomingData to find potential other sections
  for (const key in incomingData) {
    // Skip already handled top-level primitives
    if (typeof incomingData[key] !== 'object' || incomingData[key] === null) continue;

    // Skip already explicitly handled sections (add any specific keys here)
    if (['patientID', 'ID', 'personInformation', 'guardianInformation', 'vitals', 'vaccineSchedule',
         'vaccineAdministration', 'appointments', 'diagnosis', 'MedicationOrder'].includes(key)) {
      continue;
    }

    const incomingSection = incomingData[key];
    const existingSection = existingData[key]; // Can be undefined

    // Scenario 1: Object with 'saved' and/or 'unsaved' arrays
    if (incomingSection && typeof incomingSection === 'object' &&
        (Array.isArray(incomingSection.saved) || Array.isArray(incomingSection.unsaved))) {

      // Compare saved array generically
      const genericSavedChanges = compareArrays(
        existingSection?.saved || [],
        incomingSection.saved || [],
        `${key}.saved`
      );
      if (genericSavedChanges.length > 0) {
        changes.push(...genericSavedChanges);
      }

      // Compare unsaved array generically
      const genericUnsavedChanges = compareArrays(
        existingSection?.unsaved || [],
        incomingSection.unsaved || [],
        `${key}.unsaved`
      );
      if (genericUnsavedChanges.length > 0) {
        changes.push(...genericUnsavedChanges);
      }
    }
    // Scenario 2: General object (not saved/unsaved structure, not an array)
    else if (incomingSection && typeof incomingSection === 'object' && !Array.isArray(incomingSection)) {
        const objectChanges = compareObjects(
            existingSection || {}, // Provide an empty object if existingSection is undefined
            incomingSection,
            key
        );
        if (objectChanges.length > 0) {
            changes.push(...objectChanges);
        }
    }
    // Scenario 3: General array (not saved/unsaved structure)
    else if (Array.isArray(incomingSection)) {
        const arrayChanges = compareArrays(
            existingSection || [], // Provide an empty array if existingSection is undefined
            incomingSection,
            key
        );
        if (arrayChanges.length > 0) {
            changes.push(...arrayChanges);
        }
    }
    // Scenario 4: Primitive value changes (already handled at top-level)
  }


  return {
    hasNewData: changes.length > 0,
    changes
  };
}

// Helper function to compare simple properties
function compareSimpleProperties(obj1: any, obj2: any): string[] {
  const changes: string[] = [];

  // Check for updates in obj1's properties
  for (const key in obj1) {
    // Skip objects and arrays as they'll be handled separately
    if (obj1[key] !== null &&
        typeof obj1[key] !== 'object' &&
        key in obj2 &&
        obj1[key] !== obj2[key]) {
      changes.push(key);
    }
  }

  // Check for new properties in obj2 that don't exist in obj1
  for (const key in obj2) {
    if (!(key in obj1) && obj2[key] !== null && typeof obj2[key] !== 'object') {
      changes.push(key); // Mark as new property
    }
  }

  return changes;
}

// Helper function to compare objects
function compareObjects(obj1: any, obj2: any, section: string): any[] {
  const changes: any[] = [];

  if (!obj1 && obj2) { // New object entirely
    changes.push({ section, type: 'new', details: { new: obj2 } });
    return changes;
  }
  if (obj1 && !obj2) { // Object removed entirely
    changes.push({ section, type: 'removed', details: { old: obj1 } });
    return changes;
  }
  if (!obj1 && !obj2) { // Both null/undefined, no change
    return changes;
  }

  // Check for updated or new properties in obj2 compared to obj1
  for (const key in obj2) {
    if (!(key in obj1)) {
      changes.push({
        section: `${section}.${key}`,
        type: 'new',
        details: { new: obj2[key] }
      });
    } else if (typeof obj2[key] !== 'object' || obj2[key] === null) {
      // Compare primitive values
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

  // Check for properties removed from obj1 that are not in obj2
  for (const key in obj1) {
    if (!(key in obj2) && (typeof obj1[key] !== 'object' || obj1[key] === null)) {
      changes.push({
        section: `${section}.${key}`,
        type: 'removed',
        details: { old: obj1[key] }
      });
    }
  }

  return changes;
}

// Helper function to compare arrays - MODIFIED to detect removals
function compareArrays(arr1: any[], arr2: any[], section: string): any[] {
  arr1 = Array.isArray(arr1) ? arr1 : [];
  arr2 = Array.isArray(arr2) ? arr2 : [];
  const changes: any[] = [];
  const arr1Map = new Map(arr1.map(item => [JSON.stringify(item), item])); // Use stringified for generic comparison
  const arr2Map = new Map(arr2.map(item => [JSON.stringify(item), item]));

  // Check for new items (present in arr2 but not in arr1)
  for (const item of arr2) {
    const itemString = JSON.stringify(item);
    if (!arr1Map.has(itemString)) {
      // This item is new or updated in a way that its stringified version is unique
      // We need to differentiate between truly new and updated existing items
      let isUpdated = false;
      // Heuristic for updated: Check if an item exists in arr1 with similar structure but different content
      // This is less precise without a specific ID, but better than nothing
      for (const existingItem of arr1) {
          // If items are objects and have some common keys, try to infer an update
          // This is a complex problem without explicit IDs. For now, rely on JSON.stringify.
          // If you have a primary key, use compareArraysById or similar.
      }
      if (!isUpdated) {
          changes.push({
              section: section,
              type: 'new',
              details: { newItem: item }
          });
      }
    }
  }

  // Check for removed items (present in arr1 but not in arr2)
  for (const item of arr1) {
    const itemString = JSON.stringify(item);
    if (!arr2Map.has(itemString)) {
      changes.push({
        section: section,
        type: 'removed',
        details: { removedItem: item }
      });
    }
  }

  // Check for updated items (present in both, but content differs)
  // This relies on the original index for 'updated' type as compareArrays was designed.
  // The above new/removed logic is more robust for general array content changes.
  const minLength = Math.min(arr1.length, arr2.length);
  for (let i = 0; i < minLength; i++) {
      if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) {
          // Only if this isn't already marked as new or removed based on the content check
          const item1String = JSON.stringify(arr1[i]);
          const item2String = JSON.stringify(arr2[i]);
          if (arr1Map.has(item2String) && arr2Map.has(item1String)) {
              // This condition is tricky: it implies the item was just moved or shuffled,
              // or it's a true update at the same index.
              // For a simple JSON.stringify based comparison, we prioritize 'new'/'removed'.
              // An 'updated' at index `i` implies the content changed but it's still "the same item".
              // Without IDs, it's hard to be certain.
              // Let's ensure this 'updated' report is meaningful.
              // If an item at index `i` changed, and its new form is not present as a 'new' item,
              // and its old form is not present as a 'removed' item, then it's an update.
              const isOldFormRemoved = changes.some(c => c.type === 'removed' && JSON.stringify(c.details.removedItem) === item1String);
              const isNewFormAdded = changes.some(c => c.type === 'new' && JSON.stringify(c.details.newItem) === item2String);

              if (!isOldFormRemoved && !isNewFormAdded) {
                  changes.push({
                      section: `${section}[${i}]`,
                      type: 'updated',
                      details: { old: arr1[i], new: arr2[i] }
                  });
              }
          }
      }
  }

  // Deduplicate changes if the same item is reported multiple ways (e.g., new and updated)
  // This can happen due to the multi-pass comparison. A simpler approach often uses IDs.
  // For generic arrays without IDs, strict deduplication based on section and details.
  const uniqueChanges = [];
  const changeSet = new Set(); // Stores a string representation of the change

  for (const change of changes) {
      const changeId = JSON.stringify(change);
      if (!changeSet.has(changeId)) {
          uniqueChanges.push(change);
          changeSet.add(changeId);
      }
  }

  return uniqueChanges;
}


// Helper function for comparing arrays where items have concept_id
function compareArraysByConceptId(arr1: any[], arr2: any[], section: string): any[] {
  const changes: any[] = [];
  const arr1Map = new Map(arr1.map(item => [item.concept_id, item]));
  const arr2Map = new Map(arr2.map(item => [item.concept_id, item])); // Added for removals

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

  // Check for removed items
  for (const item of arr1) {
      if (!arr2Map.has(item.concept_id)) {
          changes.push({
              section: `${section}`,
              type: 'removed',
              details: { removedItem: item }
          });
      }
  }

  return changes;
}

// Helper function for comparing arrays where items have obs_id
function compareArraysByObsId(arr1: any[], arr2: any[], section: string): any[] {
  const changes: any[] = [];
  const arr1Map = new Map(arr1.map(item => [item.obs_id, item]));
  const arr2Map = new Map(arr2.map(item => [item.obs_id, item])); // Added for removals

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

  // Check for removed items
  for (const item of arr1) {
      if (!arr2Map.has(item.obs_id)) {
          changes.push({
              section: `${section}`,
              type: 'removed',
              details: { removedItem: item }
          });
      }
  }

  return changes;
}

// Helper function to compare vaccine schedules - Adjusted to include removal detection
function compareVaccineSchedule(schedule1: any[], schedule2: any[]): any[] {
  const changes: any[] = [];
  const schedule1Map = new Map(schedule1.map(visit => [visit.visit, visit]));
  const schedule2Map = new Map(schedule2.map(visit => [visit.visit, visit]));

  // Check for new or updated visits
  for (const visit2 of schedule2) {
    if (!schedule1Map.has(visit2.visit)) {
      changes.push({
        section: `vaccineSchedule.vaccine_schedule`,
        type: 'new',
        details: { newVisit: visit2 }
      });
    } else {
      const visit1 = schedule1Map.get(visit2.visit);

      // Check visit properties
      if (visit1.milestone_status !== visit2.milestone_status) {
        changes.push({
          section: `vaccineSchedule.vaccine_schedule (visit: ${visit2.visit})`,
          type: 'updated',
          details: {
            property: 'milestone_status',
            old: visit1.milestone_status,
            new: visit2.milestone_status
          }
        });
      }

      // Check antigens
      const antigens1Map = new Map(visit1.antigens.map(a => [a.drug_id, a]));
      const antigens2Map = new Map(visit2.antigens.map(a => [a.drug_id, a]));

      // New or updated antigens
      for (const antigen2 of visit2.antigens) {
        if (!antigens1Map.has(antigen2.drug_id)) {
          changes.push({
            section: `vaccineSchedule.vaccine_schedule (visit: ${visit2.visit}).antigens`,
            type: 'new',
            details: { newAntigen: antigen2 }
          });
        } else {
          const antigen1 = antigens1Map.get(antigen2.drug_id);
          if (JSON.stringify(antigen1) !== JSON.stringify(antigen2)) { // Deep compare antigen object
            changes.push({
              section: `vaccineSchedule.vaccine_schedule (visit: ${visit2.visit}).antigens (drug_id: ${antigen2.drug_id})`,
              type: 'updated',
              details: {
                old: antigen1,
                new: antigen2
              }
            });
          }
        }
      }

      // Removed antigens
      for (const antigen1 of visit1.antigens) {
          if (!antigens2Map.has(antigen1.drug_id)) {
              changes.push({
                  section: `vaccineSchedule.vaccine_schedule (visit: ${visit2.visit}).antigens`,
                  type: 'removed',
                  details: { removedAntigen: antigen1 }
              });
          }
      }
    }
  }

  // Check for removed visits
  for (const visit1 of schedule1) {
      if (!schedule2Map.has(visit1.visit)) {
          changes.push({
              section: `vaccineSchedule.vaccine_schedule`,
              type: 'removed',
              details: { removedVisit: visit1 }
          });
      }
  }

  return changes;
}

// Helper function to compare medication orders which might have NCD_Drug_Orders
function compareMedicationOrders(orders1: any[], orders2: any[], section: string): any[] {
    const changes: any[] = [];

    // Create maps for orders by order_id (if available) or by stringified content for generic
    const orders1Map = new Map(orders1.map(order => order.order_id ? [order.order_id, order] : [JSON.stringify(order), order]));
    const orders2Map = new Map(orders2.map(order => order.order_id ? [order.order_id, order] : [JSON.stringify(order), order]));

    // Check for new or updated orders
    for (const incomingOrder of orders2) {
        const orderId = incomingOrder.order_id;
        const incomingOrderKey = orderId || JSON.stringify(incomingOrder);

        if (!orders1Map.has(incomingOrderKey)) {
            changes.push({
                section: `${section}`,
                type: 'new',
                details: { newOrder: incomingOrder }
            });
        } else {
            const existingOrder = orders1Map.get(incomingOrderKey);
            // Deep comparison
            if (JSON.stringify(existingOrder) !== JSON.stringify(incomingOrder)) {
                changes.push({
                    section: `${section}` + (orderId ? ` (order_id: ${orderId})` : ''),
                    type: 'updated',
                    details: { old: existingOrder, new: incomingOrder }
                });
            }
        }
    }

    // Check for removed orders
    for (const existingOrder of orders1) {
        const orderId = existingOrder.order_id;
        const existingOrderKey = orderId || JSON.stringify(existingOrder);
        if (!orders2Map.has(existingOrderKey)) {
            changes.push({
                section: `${section}`,
                type: 'removed',
                details: { removedOrder: existingOrder }
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

  console.log(`Changes detected for patient: ${existingData.patientID || incomingData.patientID}`, changes);
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
  // if (parseInt(existingData.patientID as any) !== parseInt(incomingData.patientID as any)) {
  //   console.error("Incoming PatientID: ", incomingData.patientID)
  //   console.error("existing PatientID: ",existingData.patientID )
  //   // throw new Error('Cannot merge data for different patients: '+existingData.patientID );
  // }

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
      // Only update if the incoming value is different
      if (mergedData[key] !== incomingData[key]) {
        mergedData[key] = incomingData[key];
      }
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
      const existingUnsavedMap = new Map(
        mergedData.guardianInformation.unsaved.map(item => [item.relationship_id, item])
      );

      // Add only new unsaved items or update existing ones
      incomingData.guardianInformation.unsaved.forEach(unsavedItem => {
        if (!unsavedItem.relationship_id || !existingUnsavedMap.has(unsavedItem.relationship_id)) {
          // Add new unsaved item
          mergedData.guardianInformation.unsaved.push(unsavedItem);
        } else {
          // Update existing unsaved item
          const index = mergedData.guardianInformation.unsaved.findIndex(
            item => item.relationship_id === unsavedItem.relationship_id
          );
          if (index !== -1) { // Ensure found
            mergedData.guardianInformation.unsaved[index] = mergeObjects(mergedData.guardianInformation.unsaved[index], unsavedItem);
          }
        }
      });
    }
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
        // Filter out any unsaved items that now appear in saved
        mergedData.vitals.unsaved = mergedData.vitals.unsaved.filter(unsavedItem => {
          return !mergedData.vitals.saved.some(savedItem => {
            // Match by obs_id if available, otherwise by concept_id and datetime
            if (unsavedItem.obs_id && savedItem.obs_id) {
                return savedItem.obs_id === unsavedItem.obs_id;
            }
            return unsavedItem.concept_id === savedItem.concept_id &&
                   normalizeDate(unsavedItem.obs_datetime) === normalizeDate(savedItem.obs_datetime); // Use normalizeDate for consistency
          });
        });
      }
    }

    // Now handle incoming unsaved vitals
    if (incomingData.vitals.unsaved && incomingData.vitals.unsaved.length > 0) {
      // Create maps for quick lookups
      const existingUnsavedMap = new Map();
      mergedData.vitals.unsaved.forEach(item => {
        if (item.obs_id) {
          existingUnsavedMap.set(item.obs_id, item);
        } else if (item.concept_id && item.obs_datetime) {
          existingUnsavedMap.set(`${item.concept_id}-${normalizeDate(item.obs_datetime)}`, item);
        }
      });

      // Add or update unsaved items
      incomingData.vitals.unsaved.forEach(item => {
        let key;
        if (item.obs_id) {
          key = item.obs_id;
        } else if (item.concept_id && item.obs_datetime) {
          key = `${item.concept_id}-${normalizeDate(item.obs_datetime)}`;
        }

        if (!key || !existingUnsavedMap.has(key)) {
          // Add new unsaved item
          mergedData.vitals.unsaved.push(item);
        } else {
          // Update existing unsaved item
          const index = mergedData.vitals.unsaved.findIndex(unsavedItem => {
            if (item.obs_id) {
              return unsavedItem.obs_id === item.obs_id;
            }
            return unsavedItem.concept_id === item.concept_id &&
                   normalizeDate(unsavedItem.obs_datetime) === normalizeDate(item.obs_datetime);
          });
          if (index !== -1) {
            mergedData.vitals.unsaved[index] = mergeObjects(mergedData.vitals.unsaved[index], item);
          }
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
        if (!existingVoidedSet.has(voidedItem)) { // Assuming voided items are primitive or string-comparable
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
        mergedData.appointments.unsaved = mergedData.appointments.unsaved.filter(unsavedItem => {
          return !mergedData.appointments.saved.some(savedItem => {
            // Match by obs_id if available, else by concept_id and value_datetime
            if (unsavedItem.obs_id && savedItem.obs_id) {
              return savedItem.obs_id === unsavedItem.obs_id;
            }
            return savedItem.concept_id === unsavedItem.concept_id &&
                   normalizeDate(savedItem.value_datetime) === normalizeDate(unsavedItem.value_datetime);
          });
        });
      }
    }

    // Now handle unsaved appointments
    if (incomingData.appointments.unsaved && incomingData.appointments.unsaved.length > 0) {
      const existingUnsavedMap = new Map();
      mergedData.appointments.unsaved.forEach(item => {
        if (item.obs_id) {
          existingUnsavedMap.set(item.obs_id, item);
        } else if (item.concept_id && item.value_datetime) {
          existingUnsavedMap.set(`${item.concept_id}-${normalizeDate(item.value_datetime)}`, item);
        }
      });

      // Add or update unsaved appointments
      incomingData.appointments.unsaved.forEach(item => {
        let key;
        if (item.obs_id) {
          key = item.obs_id;
        } else if (item.concept_id && item.value_datetime) {
          key = `${item.concept_id}-${normalizeDate(item.value_datetime)}`;
        }

        if (!key || !existingUnsavedMap.has(key)) {
          // Add new unsaved appointment
          mergedData.appointments.unsaved.push(item);
        } else {
          // Update existing unsaved appointment
          const index = mergedData.appointments.unsaved.findIndex(unsavedItem => {
            if (item.obs_id) {
              return unsavedItem.obs_id === item.obs_id;
            }
            return unsavedItem.concept_id === item.concept_id &&
                   normalizeDate(unsavedItem.value_datetime) === normalizeDate(item.value_datetime);
          });
          if (index !== -1) {
            mergedData.appointments.unsaved[index] = mergeObjects(mergedData.appointments.unsaved[index], item);
          }
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
          // For items without obs_id, they remain in unsaved unless they exactly match a saved item conceptually
          return !mergedData.diagnosis.saved.some(savedItem =>
              savedItem.concept_id === unsavedItem.concept_id &&
              normalizeDate(savedItem.obs_datetime) === normalizeDate(unsavedItem.obs_datetime)
          );
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
          existingUnsavedMap.set(`${item.concept_id}-${normalizeDate(item.obs_datetime)}`, item);
        }
      });

      // Add or update unsaved diagnoses
      incomingData.diagnosis.unsaved.forEach(item => {
        let key;
        if (item.obs_id) {
          key = item.obs_id;
        } else if (item.concept_id && item.obs_datetime) {
          key = `${item.concept_id}-${normalizeDate(item.obs_datetime)}`;
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
                   normalizeDate(unsavedItem.obs_datetime) === normalizeDate(item.obs_datetime);
          });
          if (index !== -1) {
            mergedData.diagnosis.unsaved[index] = mergeObjects(mergedData.diagnosis.unsaved[index], item);
          }
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
      const incomingUnsaved = incomingData.MedicationOrder.unsaved || [];

      // Find NCD_Drug_Orders section in incoming unsaved data
      const incomingNcdSection = incomingUnsaved.find(
        item => item.NCD_Drug_Orders?.length > 0
      );

      if (incomingNcdSection) {
        // Deduplicate incoming NCD_Drug_Orders against saved medications
        const deduplicatedNcdOrders = deduplicateNcdDrugOrders(
          savedMedications,
          incomingNcdSection.NCD_Drug_Orders || []
        );

        // Find existing NCD section in merged data's unsaved array
        let existingNcdSection = mergedData.MedicationOrder.unsaved.find(
          item => item.NCD_Drug_Orders?.length > 0
        );

        if (deduplicatedNcdOrders.length > 0) {
          if (existingNcdSection) {
            // Update existing section's NCD_Drug_Orders
            existingNcdSection.NCD_Drug_Orders = mergeNcdDrugOrders(
              existingNcdSection.NCD_Drug_Orders || [],
              deduplicatedNcdOrders
            );
          } else {
            // Add new section with deduplicated orders to unsaved
            mergedData.MedicationOrder.unsaved.push({
              ...incomingNcdSection,
              NCD_Drug_Orders: deduplicatedNcdOrders
            });
          }
        } else if (existingNcdSection) {
          existingNcdSection.NCD_Drug_Orders = [];
        }

        // Now merge the rest of the unsaved (non-NCD) orders without removing existing ones
        const incomingNonNcdOrders = incomingUnsaved.filter(
          order => !(order.NCD_Drug_Orders?.length > 0)
        );

        incomingNonNcdOrders.forEach(order => {
          const orderKey = createMedicationKey(order.drug_id, order.start_date);
          const isSaved = savedMedications.some(saved =>
            createMedicationKey(saved.drug_id, saved.start_date) === orderKey
          );
          const existsInUnsaved = mergedData.MedicationOrder.unsaved.some(existingOrder =>
            !existingOrder.NCD_Drug_Orders &&
            createMedicationKey(existingOrder.drug_id, existingOrder.start_date) === orderKey
          );

          if (!isSaved && !existsInUnsaved) {
            mergedData.MedicationOrder.unsaved.push(order);
          }
          // Optionally, update if existsInUnsaved
        });

        // No need to reconstruct the unsaved array, just update in place
      } else {
        // If no NCD_Drug_Orders in incoming, just merge the rest of unsaved
          const mergedUnsavedRegularOrders = [...(mergedData.MedicationOrder.unsaved || [])];
          incomingUnsaved.forEach(order => {
              const orderKey = createMedicationKey(order.drug_id, order.start_date);
              const isSaved = savedMedications.some(saved =>
                  createMedicationKey(saved.drug_id, saved.start_date) === orderKey
              );

              if (!isSaved) {
                  const existingIndex = mergedUnsavedRegularOrders.findIndex(existingOrder =>
                      createMedicationKey(existingOrder.drug_id, existingOrder.start_date) === orderKey
                  );
                  if (existingIndex !== -1) {
                      mergedUnsavedRegularOrders[existingIndex] = mergeObjects(mergedUnsavedRegularOrders[existingIndex], order);
                  } else {
                      mergedUnsavedRegularOrders.push(order);
                  }
              }
          });
          mergedData.MedicationOrder.unsaved = mergedUnsavedRegularOrders;
      }
    }
  }


  // --- CATCH-ALL GENERIC MERGE FOR OTHER SECTIONS ---
  for (const key in incomingData) {
    // Skip already handled top-level primitives
    if (typeof incomingData[key] !== 'object' || incomingData[key] === null) continue;

    // Skip already explicitly handled sections (add any specific keys here as needed)
    if (['patientID', 'ID', 'personInformation', 'guardianInformation', 'vitals', 'vaccineSchedule',
         'vaccineAdministration', 'appointments', 'diagnosis', 'MedicationOrder'].includes(key)) {
      continue;
    }

    const incomingSection = incomingData[key];
    const existingSection = mergedData[key];

    // Scenario 1: Object with 'saved' and/or 'unsaved' arrays
    if (incomingSection && typeof incomingSection === 'object' &&
        (Array.isArray(incomingSection.saved) || Array.isArray(incomingSection.unsaved))) {

      mergedData[key] = existingSection || { saved: [], unsaved: [] };
      mergedData[key].saved = Array.isArray(existingSection?.saved) ? [...existingSection.saved] : [];
      mergedData[key].unsaved = Array.isArray(existingSection?.unsaved) ? [...existingSection.unsaved] : [];

      // Merge saved array using basic merge (no ID assumed)
      if (Array.isArray(incomingSection.saved)) {
        mergedData[key].saved = mergeArraysGeneric(
            mergedData[key].saved,
            incomingSection.saved
        );
      }

      // Merge unsaved array using basic merge (no ID assumed)
      if (Array.isArray(incomingSection.unsaved)) {
        mergedData[key].unsaved = mergeArraysGeneric(
            mergedData[key].unsaved,
            incomingSection.unsaved
        );
      }
      // Note: No transition logic (unsaved -> saved) here as no common ID is assumed.
    }
    // Scenario 2: General object (not saved/unsaved structure, not an array)
    else if (incomingSection && typeof incomingSection === 'object' && !Array.isArray(incomingSection)) {
        mergedData[key] = mergeObjects(existingSection || {}, incomingSection);
    }
    // Scenario 3: General array (not saved/unsaved structure)
    else if (Array.isArray(incomingSection)) {
        mergedData[key] = mergeArraysGeneric(
            Array.isArray(existingSection) ? existingSection : [],
            incomingSection
        );
    }
    // Scenario 4: Primitive values are already handled at the very beginning
  }

  return {
    mergedData,
    hasChanges: true, // If we reached here, changes were detected by hasChanges
    changes: changeResult.changes
  };
}

/**
 * Merges two objects recursively
 */
function mergeObjects(obj1: any, obj2: any): any {
  const result = { ...obj1 }; // Start with a shallow copy of obj1

  for (const key in obj2) {
    // If obj2[key] is an object (but not an array) and obj1[key] is also an object (but not an array),
    // then recursively merge them.
    if (
      obj2[key] !== null &&
      typeof obj2[key] === 'object' &&
      !Array.isArray(obj2[key]) &&
      result[key] !== null &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key])
    ) {
      result[key] = mergeObjects(result[key], obj2[key]);
    }
    // Otherwise, directly assign obj2's value. This handles:
    // 1. obj2[key] is primitive (string, number, boolean, null)
    // 2. obj2[key] is an array (arrays are replaced, not merged element-by-element here)
    // 3. obj1[key] is not an object, or is null (cannot recurse)
    // 4. obj2[key] exists but not in obj1 (new property)
    else {
      result[key] = obj2[key];
    }
  }

  // Handle properties removed from obj1 if they are not in obj2 (for objects)
  for (const key in obj1) {
    if (!(key in obj2)) {
      delete result[key];
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

    if (id === undefined || id === null) { // Handle items without a valid ID field for merging
      // If no ID, just add to the result (might lead to duplicates if not careful)
      result.push(item);
    } else if (!idMap.has(id)) {
      // If ID doesn't exist in result, add it
      result.push(item);
      idMap.set(id, item);
    } else {
      // If ID exists, update the existing item by merging
      const existingItem = idMap.get(id);
      const index = result.findIndex(r => r[idField] === id);

      if (typeof item === 'object' && typeof existingItem === 'object') {
        result[index] = mergeObjects(existingItem, item);
      } else {
        result[index] = item; // Replace if not objects (e.g., primitives)
      }
    }
  }

  // Consider if items present in arr1 but not in arr2 should be removed from result
  // This function assumes arr2 is the "source of truth" for updates/additions to existing IDs,
  // but doesn't explicitly remove items that are missing from arr2.
  // If removals are needed, additional logic is required (similar to compareArrays removal detection).

  return result;
}

/**
 * Generic array merge. Adds new items (based on JSON.stringify) and updates existing ones if found.
 * Does NOT handle removals explicitly; it's a 'union and update' approach.
 */
function mergeArraysGeneric(existing: any[], incoming: any[]): any[] {
    const result = [...existing];
    const existingMap = new Map(result.map(item => [JSON.stringify(item), item])); // Use stringified as key for comparison

    for (const item of incoming) {
        const itemString = JSON.stringify(item);
        if (!existingMap.has(itemString)) {
            // Check if there's an existing item that has been updated (partial match heuristic)
            let updatedExistingIndex = -1;
            for (let i = 0; i < result.length; i++) {
                // This is a simple heuristic. A more robust generic update requires common keys/properties
                // that identify an item even if its content changes. Without a common ID,
                // this is essentially a 'replace if similar enough' or 'add if entirely new'.
                // For this generic function, we'll lean towards adding if not an exact stringified match.
                // If you need more complex updates for generic arrays, you'll need to define a 'key' strategy.
            }

            if (updatedExistingIndex === -1) {
                result.push(item); // Truly new item
            } else {
                result[updatedExistingIndex] = mergeObjects(result[updatedExistingIndex], item); // Update existing
            }
        }
    }
    return result;
}


/**
 * Merges vitals data with special handling for obs_datetime
 */
function mergeVitalsData(existing: any[], incoming: any[]): any[] {
  // Prioritize merge by obs_id if available in incoming data
  if (incoming.some(item => 'obs_id' in item && item.obs_id !== null)) {
    return mergeArraysById(existing, incoming, 'obs_id');
  }

  // If no obs_id, try to match by concept_id and obs_datetime
  const result = [...existing];
  const existingMap = new Map(); // Key: `${concept_id}-${normalized_obs_datetime}`

  result.forEach(item => {
    if (item.concept_id && item.obs_datetime) {
      existingMap.set(`${item.concept_id}-${normalizeDate(item.obs_datetime)}`, item);
    }
  });

  for (const item of incoming) {
    if (!item.concept_id || !item.obs_datetime) {
      // If missing critical matching fields, just push (or handle as an error/skip)
      result.push(item);
      continue;
    }

    const key = `${item.concept_id}-${normalizeDate(item.obs_datetime)}`;

    if (existingMap.has(key)) {
      // Update existing item by merging
      const existingItem = existingMap.get(key);
      const index = result.findIndex(r => r.concept_id === item.concept_id && normalizeDate(r.obs_datetime) === normalizeDate(item.obs_datetime));
      if (index !== -1) {
        result[index] = mergeObjects(existingItem, item);
      }
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
  const result: any[] = JSON.parse(JSON.stringify(existing)); // Deep copy to modify safely

  for (const incomingVisit of incoming) {
    if (!visitMap.has(incomingVisit.visit)) {
      // This is a new visit
      result.push(incomingVisit);
      // Add to map for subsequent lookups if needed within this loop (though not typically needed for new)
      visitMap.set(incomingVisit.visit, incomingVisit);
      continue;
    }

    // Get the existing visit (from the result array, not the original existing)
    const existingVisitIndex = result.findIndex(v => v.visit === incomingVisit.visit);
    if (existingVisitIndex === -1) continue; // Should not happen if visitMap works

    const existingVisit = result[existingVisitIndex];

    // Update milestone status if changed
    if (incomingVisit.milestone_status !== existingVisit.milestone_status) {
      existingVisit.milestone_status = incomingVisit.milestone_status;
    }

    // Merge antigens
    if (incomingVisit.antigens && incomingVisit.antigens.length > 0) {
      const antigenMap = new Map(existingVisit.antigens.map(a => [a.drug_id, a]));

      for (const incomingAntigen of incomingVisit.antigens) {
        if (!antigenMap.has(incomingAntigen.drug_id)) {
          // New antigen
          existingVisit.antigens.push(incomingAntigen);
        } else {
          // Update existing antigen
          const antigenIndex = existingVisit.antigens.findIndex(
            a => a.drug_id === incomingAntigen.drug_id
          );

          if (antigenIndex !== -1) {
              const currentAntigen = existingVisit.antigens[antigenIndex];
              // Perform a deep merge for antigen properties
              existingVisit.antigens[antigenIndex] = mergeObjects(currentAntigen, incomingAntigen);
          }
        }
      }

      // Handle removed antigens from existingVisit if they are not in incomingVisit
      const incomingAntigenIds = new Set(incomingVisit.antigens.map(a => a.drug_id));
      existingVisit.antigens = existingVisit.antigens.filter(antigen =>
          incomingAntigenIds.has(antigen.drug_id)
      );

    } else if (incomingVisit.antigens && incomingVisit.antigens.length === 0) {
        // If incoming has an empty antigen array, clear existing antigens
        existingVisit.antigens = [];
    }
  }

  // Handle removed visits from existing if they are not in incoming
  const incomingVisitNumbers = new Set(incoming.map(v => v.visit));
  const finalResult = result.filter(visit => incomingVisitNumbers.has(visit.visit));

  return finalResult;
}

/**
 * Merges appointment data based on concept_id and value_datetime (or obs_id)
 */
function mergeAppointments(existing: any[], incoming: any[]): any[] {
  // Prioritize merge by obs_id if available in incoming data
  if (incoming.some(item => 'obs_id' in item && item.obs_id !== null)) {
    return mergeArraysById(existing, incoming, 'obs_id');
  }

  // If no obs_id, try to match by concept_id and value_datetime
  const result = [...existing];
  const existingMap = new Map(); // Key: `${concept_id}-${normalized_value_datetime}`

  result.forEach(item => {
    if (item.concept_id && item.value_datetime) {
      existingMap.set(`${item.concept_id}-${normalizeDate(item.value_datetime)}`, item);
    }
  });

  for (const item of incoming) {
    if (!item.concept_id || !item.value_datetime) {
      // If missing critical matching fields, just push
      result.push(item);
      continue;
    }

    const key = `${item.concept_id}-${normalizeDate(item.value_datetime)}`;

    if (existingMap.has(key)) {
      // Update existing appointment by merging
      const existingItem = existingMap.get(key);
      const index = result.findIndex(r => r.concept_id === item.concept_id && normalizeDate(r.value_datetime) === normalizeDate(item.value_datetime));
      if (index !== -1) {
        result[index] = mergeObjects(existingItem, item);
      }
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
      if (index !== -1) {
        result[index] = mergeObjects(result[index], drug);
      }
    }
  }

  // Consider if removals from incoming should remove from existing.
  // Current implementation: union and update.

  return result;
}
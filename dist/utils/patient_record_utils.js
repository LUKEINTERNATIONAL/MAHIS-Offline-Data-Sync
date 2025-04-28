"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sophisticatedMergePatientData = sophisticatedMergePatientData;
function hasNewOrUpdatedData(existingData, incomingData) {
    var _a, _b;
    if (existingData.patientID !== incomingData.patientID) {
        throw new Error('Patient IDs do not match');
    }
    const changes = [];
    const topLevelChanges = compareSimpleProperties(existingData, incomingData);
    if (topLevelChanges.length > 0) {
        changes.push(...topLevelChanges.map(prop => ({
            section: prop,
            type: 'updated',
            details: { old: existingData[prop], new: incomingData[prop] }
        })));
    }
    const personInfoChanges = compareObjects(existingData.personInformation, incomingData.personInformation, 'personInformation');
    if (personInfoChanges.length > 0) {
        changes.push(...personInfoChanges);
    }
    if (existingData.guardianInformation && incomingData.guardianInformation) {
        const savedGuardiansChanges = compareArrays(existingData.guardianInformation.saved || [], incomingData.guardianInformation.saved || [], 'guardianInformation.saved');
        if (savedGuardiansChanges.length > 0) {
            changes.push(...savedGuardiansChanges);
        }
        const unsavedGuardiansChanges = compareArrays(existingData.guardianInformation.unsaved || [], incomingData.guardianInformation.unsaved || [], 'guardianInformation.unsaved');
        if (unsavedGuardiansChanges.length > 0) {
            changes.push(...unsavedGuardiansChanges);
        }
    }
    if (existingData.vitals && incomingData.vitals) {
        const savedVitalsChanges = compareArrays(existingData.vitals.saved || [], incomingData.vitals.saved || [], 'vitals.saved');
        if (savedVitalsChanges.length > 0) {
            changes.push(...savedVitalsChanges);
        }
        const unsavedVitalsChanges = compareArrays(existingData.vitals.unsaved || [], incomingData.vitals.unsaved || [], 'vitals.unsaved');
        if (unsavedVitalsChanges.length > 0) {
            changes.push(...unsavedVitalsChanges);
        }
    }
    if (existingData.birthRegistration && incomingData.birthRegistration) {
        const birthRegChanges = compareArraysByConceptId(existingData.birthRegistration, incomingData.birthRegistration, 'birthRegistration');
        if (birthRegChanges.length > 0) {
            changes.push(...birthRegChanges);
        }
    }
    if (((_a = existingData.vaccineSchedule) === null || _a === void 0 ? void 0 : _a.vaccine_schedule) && ((_b = incomingData.vaccineSchedule) === null || _b === void 0 ? void 0 : _b.vaccine_schedule)) {
        const vaccineScheduleChanges = compareVaccineSchedule(existingData.vaccineSchedule.vaccine_schedule, incomingData.vaccineSchedule.vaccine_schedule);
        if (vaccineScheduleChanges.length > 0) {
            changes.push(...vaccineScheduleChanges);
        }
    }
    if (existingData.MedicationOrder && incomingData.MedicationOrder) {
        const savedMedsChanges = compareArrays(existingData.MedicationOrder.saved || [], incomingData.MedicationOrder.saved || [], 'MedicationOrder.saved');
        if (savedMedsChanges.length > 0) {
            changes.push(...savedMedsChanges);
        }
        const unsavedMedsChanges = compareMedicationOrders(existingData.MedicationOrder.unsaved || [], incomingData.MedicationOrder.unsaved || [], 'MedicationOrder.unsaved');
        if (unsavedMedsChanges.length > 0) {
            changes.push(...unsavedMedsChanges);
        }
    }
    if (existingData.diagnosis && incomingData.diagnosis) {
        const savedDiagnosisChanges = compareArraysByObsId(existingData.diagnosis.saved || [], incomingData.diagnosis.saved || [], 'diagnosis.saved');
        if (savedDiagnosisChanges.length > 0) {
            changes.push(...savedDiagnosisChanges);
        }
        const unsavedDiagnosisChanges = compareArrays(existingData.diagnosis.unsaved || [], incomingData.diagnosis.unsaved || [], 'diagnosis.unsaved');
        if (unsavedDiagnosisChanges.length > 0) {
            changes.push(...unsavedDiagnosisChanges);
        }
    }
    return {
        hasNewData: changes.length > 0,
        changes
    };
}
function compareSimpleProperties(obj1, obj2) {
    const changes = [];
    for (const key in obj1) {
        if (obj1[key] !== null &&
            typeof obj1[key] !== 'object' &&
            key in obj2 &&
            obj1[key] !== obj2[key]) {
            changes.push(key);
        }
    }
    return changes;
}
function compareObjects(obj1, obj2, section) {
    const changes = [];
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
        }
        else if (typeof obj2[key] !== 'object') {
            if (obj1[key] !== obj2[key]) {
                changes.push({
                    section: `${section}.${key}`,
                    type: 'updated',
                    details: { old: obj1[key], new: obj2[key] }
                });
            }
        }
        else if (obj2[key] !== null) {
            const nestedChanges = compareObjects(obj1[key], obj2[key], `${section}.${key}`);
            if (nestedChanges.length > 0) {
                changes.push(...nestedChanges);
            }
        }
    }
    return changes;
}
function compareArrays(arr1, arr2, section) {
    const changes = [];
    if (arr2.length > arr1.length) {
        changes.push({
            section,
            type: 'new',
            details: { newItems: arr2.slice(arr1.length) }
        });
    }
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
function compareArraysByConceptId(arr1, arr2, section) {
    const changes = [];
    const arr1Map = new Map(arr1.map(item => [item.concept_id, item]));
    for (const item of arr2) {
        if (!arr1Map.has(item.concept_id)) {
            changes.push({
                section: `${section}`,
                type: 'new',
                details: { newItem: item }
            });
        }
        else {
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
function compareArraysByObsId(arr1, arr2, section) {
    const changes = [];
    const arr1Map = new Map(arr1.map(item => [item.obs_id, item]));
    for (const item of arr2) {
        if (!arr1Map.has(item.obs_id)) {
            changes.push({
                section: `${section}`,
                type: 'new',
                details: { newItem: item }
            });
        }
        else {
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
function compareVaccineSchedule(schedule1, schedule2) {
    const changes = [];
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
function compareMedicationOrders(orders1, orders2, section) {
    const changes = [];
    if (orders1.length !== orders2.length) {
        changes.push({
            section,
            type: 'updated',
            details: { message: 'Medication orders count differs' }
        });
    }
    for (let i = 0; i < orders2.length; i++) {
        const existingOrder = i < orders1.length ? orders1[i] : null;
        const incomingOrder = orders2[i];
        if (!existingOrder) {
            changes.push({
                section: `${section}[${i}]`,
                type: 'new',
                details: { newOrder: incomingOrder }
            });
            continue;
        }
        if (incomingOrder.NCD_Drug_Orders && existingOrder.NCD_Drug_Orders) {
            const existingDrugs = new Map(existingOrder.NCD_Drug_Orders.map(drug => [drug.drug_inventory_id, drug]));
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
                }
                else {
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
        }
        else if (incomingOrder.NCD_Drug_Orders) {
            changes.push({
                section: `${section}[${i}]`,
                type: 'new',
                details: { newNCD_Drug_Orders: incomingOrder.NCD_Drug_Orders }
            });
        }
    }
    return changes;
}
function hasChanges(existingData, incomingData) {
    const { hasNewData, changes } = hasNewOrUpdatedData(existingData, incomingData);
    if (!hasNewData) {
        console.log('No changes detected');
        return { hasChanges: false, changes: [] };
    }
    console.log(`Changes detected: ${existingData.patientID}`, changes);
    return { hasChanges: true, changes };
}
function sophisticatedMergePatientData(existingData, incomingData) {
    var _a;
    if (existingData.patientID !== incomingData.patientID) {
        throw new Error('Cannot merge data for different patients');
    }
    const changeResult = hasChanges(existingData, incomingData);
    if (!changeResult.hasChanges) {
        return {
            mergedData: existingData,
            hasChanges: false,
            changes: []
        };
    }
    console.log('Merging the following changes:', changeResult.changes);
    const mergedData = JSON.parse(JSON.stringify(existingData));
    for (const key in incomingData) {
        if (typeof incomingData[key] !== 'object' || incomingData[key] === null) {
            mergedData[key] = incomingData[key];
        }
    }
    if (incomingData.personInformation) {
        mergedData.personInformation = mergeObjects(mergedData.personInformation || {}, incomingData.personInformation);
    }
    if (incomingData.guardianInformation) {
        mergedData.guardianInformation = mergedData.guardianInformation || { saved: [], unsaved: [] };
        if (incomingData.guardianInformation.saved) {
            mergedData.guardianInformation.saved = mergeArraysById(mergedData.guardianInformation.saved || [], incomingData.guardianInformation.saved, 'relationship_id');
            if (mergedData.guardianInformation.unsaved && mergedData.guardianInformation.unsaved.length > 0) {
                mergedData.guardianInformation.unsaved = mergedData.guardianInformation.unsaved.filter(unsavedItem => {
                    return !mergedData.guardianInformation.saved.some(savedItem => savedItem.relationship_id === unsavedItem.relationship_id);
                });
            }
        }
        if (incomingData.guardianInformation.unsaved && incomingData.guardianInformation.unsaved.length > 0) {
            const existingUnsavedIds = new Set(mergedData.guardianInformation.unsaved.map(item => item.relationship_id));
            incomingData.guardianInformation.unsaved.forEach(unsavedItem => {
                if (!unsavedItem.relationship_id || !existingUnsavedIds.has(unsavedItem.relationship_id)) {
                    mergedData.guardianInformation.unsaved.push(unsavedItem);
                }
                else {
                    const index = mergedData.guardianInformation.unsaved.findIndex(item => item.relationship_id === unsavedItem.relationship_id);
                    mergedData.guardianInformation.unsaved[index] = unsavedItem;
                }
            });
        }
    }
    if (incomingData.birthRegistration) {
        mergedData.birthRegistration = mergeArraysById(mergedData.birthRegistration || [], incomingData.birthRegistration, 'concept_id');
    }
    if (incomingData.vitals) {
        mergedData.vitals = mergedData.vitals || { saved: [], unsaved: [] };
        if (incomingData.vitals.saved) {
            mergedData.vitals.saved = mergeVitalsData(mergedData.vitals.saved || [], incomingData.vitals.saved);
            if (mergedData.vitals.unsaved && mergedData.vitals.unsaved.length > 0) {
                const idField = incomingData.vitals.saved.some(item => 'obs_id' in item)
                    ? 'obs_id'
                    : 'concept_id';
                mergedData.vitals.unsaved = mergedData.vitals.unsaved.filter(unsavedItem => {
                    return !mergedData.vitals.saved.some(savedItem => {
                        if (idField === 'concept_id' && unsavedItem.concept_id === savedItem.concept_id) {
                            return unsavedItem.obs_datetime === savedItem.obs_datetime;
                        }
                        return savedItem[idField] === unsavedItem[idField];
                    });
                });
            }
        }
        if (incomingData.vitals.unsaved && incomingData.vitals.unsaved.length > 0) {
            const idField = incomingData.vitals.unsaved.some(item => 'obs_id' in item)
                ? 'obs_id'
                : 'concept_id';
            const existingUnsavedMap = new Map();
            mergedData.vitals.unsaved.forEach(item => {
                if (idField === 'concept_id' && item.obs_datetime) {
                    existingUnsavedMap.set(`${item.concept_id}-${item.obs_datetime}`, item);
                }
                else if (item[idField]) {
                    existingUnsavedMap.set(item[idField], item);
                }
            });
            incomingData.vitals.unsaved.forEach(item => {
                let key;
                if (idField === 'concept_id' && item.obs_datetime) {
                    key = `${item.concept_id}-${item.obs_datetime}`;
                }
                else {
                    key = item[idField];
                }
                if (!key || !existingUnsavedMap.has(key)) {
                    mergedData.vitals.unsaved.push(item);
                }
                else {
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
    if ((_a = incomingData.vaccineSchedule) === null || _a === void 0 ? void 0 : _a.vaccine_schedule) {
        mergedData.vaccineSchedule = mergedData.vaccineSchedule || { vaccine_schedule: [] };
        mergedData.vaccineSchedule.vaccine_schedule = mergeVaccineSchedule(mergedData.vaccineSchedule.vaccine_schedule, incomingData.vaccineSchedule.vaccine_schedule);
    }
    if (incomingData.vaccineAdministration) {
        mergedData.vaccineAdministration = mergedData.vaccineAdministration || { orders: [], obs: [], voided: [] };
        if (incomingData.vaccineAdministration.orders) {
            mergedData.vaccineAdministration.orders = mergeArraysById(mergedData.vaccineAdministration.orders, incomingData.vaccineAdministration.orders, 'order_id');
        }
        if (incomingData.vaccineAdministration.obs) {
            mergedData.vaccineAdministration.obs = mergeArraysById(mergedData.vaccineAdministration.obs, incomingData.vaccineAdministration.obs, 'obs_id');
        }
        if (incomingData.vaccineAdministration.voided) {
            const existingVoidedSet = new Set(mergedData.vaccineAdministration.voided);
            incomingData.vaccineAdministration.voided.forEach(voidedItem => {
                if (!existingVoidedSet.has(voidedItem)) {
                    mergedData.vaccineAdministration.voided.push(voidedItem);
                    existingVoidedSet.add(voidedItem);
                }
            });
        }
    }
    if (incomingData.appointments) {
        mergedData.appointments = mergedData.appointments || { saved: [], unsaved: [] };
        if (incomingData.appointments.saved) {
            mergedData.appointments.saved = mergeAppointments(mergedData.appointments.saved, incomingData.appointments.saved);
            if (mergedData.appointments.unsaved && mergedData.appointments.unsaved.length > 0) {
                const hasObsId = incomingData.appointments.saved.some(item => 'obs_id' in item);
                mergedData.appointments.unsaved = mergedData.appointments.unsaved.filter(unsavedItem => {
                    return !mergedData.appointments.saved.some(savedItem => {
                        if (hasObsId && savedItem.obs_id && unsavedItem.obs_id) {
                            return savedItem.obs_id === unsavedItem.obs_id;
                        }
                        return savedItem.concept_id === unsavedItem.concept_id &&
                            savedItem.value_datetime === unsavedItem.value_datetime;
                    });
                });
            }
        }
        if (incomingData.appointments.unsaved && incomingData.appointments.unsaved.length > 0) {
            const hasObsId = incomingData.appointments.unsaved.some(item => 'obs_id' in item);
            const existingUnsavedMap = new Map();
            mergedData.appointments.unsaved.forEach(item => {
                if (hasObsId && item.obs_id) {
                    existingUnsavedMap.set(item.obs_id, item);
                }
                else if (item.concept_id && item.value_datetime) {
                    existingUnsavedMap.set(`${item.concept_id}-${item.value_datetime}`, item);
                }
            });
            incomingData.appointments.unsaved.forEach(item => {
                let key;
                if (hasObsId && item.obs_id) {
                    key = item.obs_id;
                }
                else if (item.concept_id && item.value_datetime) {
                    key = `${item.concept_id}-${item.value_datetime}`;
                }
                if (!key || !existingUnsavedMap.has(key)) {
                    mergedData.appointments.unsaved.push(item);
                }
                else {
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
    if (incomingData.diagnosis) {
        mergedData.diagnosis = mergedData.diagnosis || { saved: [], unsaved: [] };
        if (incomingData.diagnosis.saved) {
            mergedData.diagnosis.saved = mergeArraysById(mergedData.diagnosis.saved, incomingData.diagnosis.saved, 'obs_id');
            if (mergedData.diagnosis.unsaved && mergedData.diagnosis.unsaved.length > 0) {
                mergedData.diagnosis.unsaved = mergedData.diagnosis.unsaved.filter(unsavedItem => {
                    if (unsavedItem.obs_id) {
                        return !mergedData.diagnosis.saved.some(savedItem => savedItem.obs_id === unsavedItem.obs_id);
                    }
                    return true;
                });
            }
        }
        if (incomingData.diagnosis.unsaved && incomingData.diagnosis.unsaved.length > 0) {
            const existingUnsavedMap = new Map();
            mergedData.diagnosis.unsaved.forEach(item => {
                if (item.obs_id) {
                    existingUnsavedMap.set(item.obs_id, item);
                }
                else if (item.concept_id && item.obs_datetime) {
                    existingUnsavedMap.set(`${item.concept_id}-${item.obs_datetime}`, item);
                }
            });
            incomingData.diagnosis.unsaved.forEach(item => {
                let key;
                if (item.obs_id) {
                    key = item.obs_id;
                }
                else if (item.concept_id && item.obs_datetime) {
                    key = `${item.concept_id}-${item.obs_datetime}`;
                }
                if (!key || !existingUnsavedMap.has(key)) {
                    mergedData.diagnosis.unsaved.push(item);
                }
                else {
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
    if (incomingData.MedicationOrder) {
        mergedData.MedicationOrder = mergedData.MedicationOrder || { saved: [], unsaved: [] };
        if (incomingData.MedicationOrder.saved) {
            mergedData.MedicationOrder.saved = mergeArraysById(mergedData.MedicationOrder.saved, incomingData.MedicationOrder.saved, 'order_id');
            if (mergedData.MedicationOrder.unsaved && mergedData.MedicationOrder.unsaved.length > 0) {
                mergedData.MedicationOrder.unsaved = mergedData.MedicationOrder.unsaved.filter(unsavedItem => {
                    if (unsavedItem.NCD_Drug_Orders) {
                        unsavedItem.NCD_Drug_Orders = unsavedItem.NCD_Drug_Orders.filter(drug => {
                            return !mergedData.MedicationOrder.saved.some(savedItem => savedItem.drug_inventory_id === drug.drug_inventory_id);
                        });
                        return unsavedItem.NCD_Drug_Orders.length > 0;
                    }
                    if (unsavedItem.order_id) {
                        return !mergedData.MedicationOrder.saved.some(savedItem => savedItem.order_id === unsavedItem.order_id);
                    }
                    return true;
                });
            }
        }
        if (incomingData.MedicationOrder.unsaved && incomingData.MedicationOrder.unsaved.length > 0) {
            let existingNcdIndex = mergedData.MedicationOrder.unsaved.findIndex(item => item.NCD_Drug_Orders);
            let incomingNcdIndex = incomingData.MedicationOrder.unsaved.findIndex(item => item.NCD_Drug_Orders);
            if (incomingNcdIndex >= 0) {
                const incomingNcdOrders = incomingData.MedicationOrder.unsaved[incomingNcdIndex];
                if (existingNcdIndex >= 0) {
                    mergedData.MedicationOrder.unsaved[existingNcdIndex].NCD_Drug_Orders =
                        mergeNcdDrugOrders(mergedData.MedicationOrder.unsaved[existingNcdIndex].NCD_Drug_Orders, incomingNcdOrders.NCD_Drug_Orders);
                    incomingData.MedicationOrder.unsaved = incomingData.MedicationOrder.unsaved.filter((_, index) => index !== incomingNcdIndex);
                }
                else {
                    mergedData.MedicationOrder.unsaved.push(incomingNcdOrders);
                    incomingData.MedicationOrder.unsaved = incomingData.MedicationOrder.unsaved.filter((_, index) => index !== incomingNcdIndex);
                }
            }
            const existingUnsavedMap = new Map();
            mergedData.MedicationOrder.unsaved.forEach(item => {
                if (item.order_id && !item.NCD_Drug_Orders) {
                    existingUnsavedMap.set(item.order_id, item);
                }
            });
            incomingData.MedicationOrder.unsaved.forEach(item => {
                if (!item.NCD_Drug_Orders && item.order_id) {
                    if (!existingUnsavedMap.has(item.order_id)) {
                        mergedData.MedicationOrder.unsaved.push(item);
                    }
                    else {
                        const index = mergedData.MedicationOrder.unsaved.findIndex(unsavedItem => unsavedItem.order_id === item.order_id);
                        mergedData.MedicationOrder.unsaved[index] = item;
                    }
                }
                else if (!item.NCD_Drug_Orders) {
                    mergedData.MedicationOrder.unsaved.push(item);
                }
            });
        }
    }
    return {
        mergedData,
        hasChanges: true,
        changes: changeResult.changes
    };
}
function mergeObjects(obj1, obj2) {
    const result = Object.assign({}, obj1);
    for (const key in obj2) {
        if (!(key in result)) {
            result[key] = obj2[key];
        }
        else if (obj2[key] !== null &&
            typeof obj2[key] === 'object' &&
            !Array.isArray(obj2[key]) &&
            result[key] !== null &&
            typeof result[key] === 'object' &&
            !Array.isArray(result[key])) {
            result[key] = mergeObjects(result[key], obj2[key]);
        }
        else {
            result[key] = obj2[key];
        }
    }
    return result;
}
function mergeArraysById(arr1, arr2, idField) {
    if (!arr1 || arr1.length === 0)
        return [...arr2];
    if (!arr2 || arr2.length === 0)
        return [...arr1];
    const result = [...arr1];
    const idMap = new Map(result.map(item => [item[idField], item]));
    for (const item of arr2) {
        const id = item[idField];
        if (id === undefined) {
            result.push(item);
        }
        else if (!idMap.has(id)) {
            result.push(item);
            idMap.set(id, item);
        }
        else {
            const existingItem = idMap.get(id);
            const index = result.findIndex(r => r[idField] === id);
            if (typeof item === 'object' && typeof existingItem === 'object') {
                result[index] = mergeObjects(existingItem, item);
            }
            else {
                result[index] = item;
            }
        }
    }
    return result;
}
function mergeVitalsData(existing, incoming) {
    if (incoming.some(item => 'obs_id' in item)) {
        return mergeArraysById(existing, incoming, 'obs_id');
    }
    const result = [...existing];
    for (const item of incoming) {
        if (!item.concept_id || !item.obs_datetime) {
            result.push(item);
            continue;
        }
        const index = result.findIndex(r => r.concept_id === item.concept_id && r.obs_datetime === item.obs_datetime);
        if (index >= 0) {
            result[index] = Object.assign(Object.assign({}, result[index]), item);
        }
        else {
            result.push(item);
        }
    }
    return result;
}
function mergeVaccineSchedule(existing, incoming) {
    if (!existing || existing.length === 0)
        return [...incoming];
    if (!incoming || incoming.length === 0)
        return [...existing];
    const visitMap = new Map(existing.map(visit => [visit.visit, visit]));
    const result = [...existing];
    for (const incomingVisit of incoming) {
        if (!visitMap.has(incomingVisit.visit)) {
            result.push(incomingVisit);
            continue;
        }
        const existingVisit = visitMap.get(incomingVisit.visit);
        const visitIndex = result.findIndex(v => v.visit === incomingVisit.visit);
        if (incomingVisit.milestone_status !== existingVisit.milestone_status) {
            result[visitIndex].milestone_status = incomingVisit.milestone_status;
        }
        if (incomingVisit.antigens && incomingVisit.antigens.length > 0) {
            const antigenMap = new Map(existingVisit.antigens.map(a => [a.drug_id, a]));
            for (const incomingAntigen of incomingVisit.antigens) {
                if (!antigenMap.has(incomingAntigen.drug_id)) {
                    result[visitIndex].antigens.push(incomingAntigen);
                }
                else {
                    const antigenIndex = result[visitIndex].antigens.findIndex(a => a.drug_id === incomingAntigen.drug_id);
                    const existingAntigen = result[visitIndex].antigens[antigenIndex];
                    if (incomingAntigen.status !== existingAntigen.status ||
                        incomingAntigen.date_administered !== existingAntigen.date_administered ||
                        incomingAntigen.can_administer !== existingAntigen.can_administer) {
                        result[visitIndex].antigens[antigenIndex] = Object.assign(Object.assign({}, existingAntigen), { status: incomingAntigen.status, can_administer: incomingAntigen.can_administer, date_administered: incomingAntigen.date_administered, administered_by: incomingAntigen.administered_by, vaccine_batch_number: incomingAntigen.vaccine_batch_number, encounter_id: incomingAntigen.encounter_id, order_id: incomingAntigen.order_id });
                    }
                }
            }
        }
    }
    return result;
}
function mergeAppointments(existing, incoming) {
    if (incoming.some(item => 'obs_id' in item)) {
        return mergeArraysById(existing, incoming, 'obs_id');
    }
    const result = [...existing];
    for (const item of incoming) {
        if (!item.concept_id || !item.value_datetime) {
            result.push(item);
            continue;
        }
        const index = result.findIndex(r => r.concept_id === item.concept_id && r.value_datetime === item.value_datetime);
        if (index >= 0) {
            result[index] = Object.assign(Object.assign({}, result[index]), item);
        }
        else {
            result.push(item);
        }
    }
    return result;
}
function mergeNcdDrugOrders(existing, incoming) {
    const result = [...existing];
    const drugMap = new Map(result.map(drug => [drug.drug_inventory_id, drug]));
    for (const drug of incoming) {
        if (!drugMap.has(drug.drug_inventory_id)) {
            result.push(drug);
        }
        else {
            const index = result.findIndex(d => d.drug_inventory_id === drug.drug_inventory_id);
            result[index] = Object.assign(Object.assign({}, result[index]), drug);
        }
    }
    return result;
}
//# sourceMappingURL=patient_record_utils.js.map
/**
 * Normalizes date strings to YYYY-MM-DD format for consistent comparison
 */
export function normalizeDate(dateString: string | null | undefined): string | null {
    if (!dateString) {
        return null;
    }

    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch {
        return dateString;
    }
}

/**
 * Creates a unique key for medication order comparison
 */
export function createMedicationKey(drugId: string | number, startDate: string | null): string {
    return `${drugId}|${normalizeDate(startDate)}`;
}

/**
 * Performs deduplication of NCD Drug Orders against saved medication orders
 */
export function deduplicateNcdDrugOrders(
    savedMedications: any[],
    ncdDrugOrders: any[]
): any[] {
    // Create lookup map of saved medications
    const savedMedsMap = new Map(
        savedMedications.map(med => [
            createMedicationKey(med.drug_id, med.start_date),
            med
        ])
    );

    // Filter out duplicates from NCD_Drug_Orders
    return ncdDrugOrders.filter(drug => {
        const key = createMedicationKey(drug.drug_inventory_id, drug.start_date);
        return !savedMedsMap.has(key);
    });
}
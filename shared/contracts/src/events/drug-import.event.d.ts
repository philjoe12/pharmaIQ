export declare const DRUG_IMPORT_EVENTS: {
    readonly STARTED: "drug.import.started";
    readonly COMPLETED: "drug.import.completed";
    readonly FAILED: "drug.import.failed";
};
export interface DrugImportStartedPayload {
    fileName: string;
    totalDrugs: number;
    jobId: string;
}
export interface DrugImportCompletedPayload {
    jobId: string;
    drugsProcessed: number;
    duration: number;
}
export interface DrugImportFailedPayload {
    jobId: string;
    error: string;
    failedDrugs: string[];
}

import type {
	FacilityCatalogueMetadata,
	FacilityRecord,
} from "../repositories/facility-repository";

export const FACILITY_DATASET: readonly FacilityRecord[] = [];

export const FACILITY_CATALOGUE: FacilityCatalogueMetadata = {
	connected: false,
	sources: [],
	note: "No open-data source connected yet.",
};

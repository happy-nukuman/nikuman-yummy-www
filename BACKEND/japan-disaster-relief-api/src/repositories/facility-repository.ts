import type {
	FacilityCandidate,
	FacilitySource,
	StayPutZone,
} from "@nikuman-yummy/shared";

export type FacilityRecord = Omit<FacilityCandidate, "distanceMeters">;
export type StayPutPosition = readonly [latitude: number, longitude: number];
export type StayPutPolygon = readonly (readonly StayPutPosition[])[];
export type StayPutZoneRecord = StayPutZone & {
	polygon: StayPutPolygon | null;
};

export type FacilityCatalogueMetadata =
	| {
			connected: false;
			sources: [];
			note: string;
	  }
	| {
			connected: true;
			sources: FacilitySource[];
			realtime: boolean;
	  };

export type FacilityRepositorySnapshot = {
	catalogue: FacilityCatalogueMetadata;
	facilities: readonly FacilityRecord[];
	stayPutZones: readonly StayPutZoneRecord[];
};

export interface FacilityRepository {
	load(): Promise<FacilityRepositorySnapshot>;
}

export class StaticFacilityRepository implements FacilityRepository {
	constructor(
		private readonly facilities: readonly FacilityRecord[],
		private readonly catalogue: FacilityCatalogueMetadata,
		private readonly stayPutZones: readonly StayPutZoneRecord[] = [],
	) {}

	async load(): Promise<FacilityRepositorySnapshot> {
		return {
			catalogue: this.catalogue,
			facilities: this.facilities,
			stayPutZones: this.stayPutZones,
		};
	}
}

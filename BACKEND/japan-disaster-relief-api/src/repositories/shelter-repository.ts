import type { Shelter } from "@nikuman-yummy/shared";

export interface ShelterRepository {
	list(): Promise<readonly Shelter[]>;
	findById(id: string): Promise<Shelter | null>;
}

// Implementations will be added only after a real, licensed data source is selected.

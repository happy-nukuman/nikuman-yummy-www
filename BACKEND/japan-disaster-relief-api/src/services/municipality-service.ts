import type {
	Municipality,
	MunicipalityListResponse,
	MunicipalityMatchRequest,
	MunicipalityMatchResponse,
} from "@nikuman-yummy/shared";
import {
	MUNICIPALITIES,
	type MunicipalityReference,
} from "../config/municipalities";
import { haversineDistanceMeters } from "../lib/geo";

function containsPoint(
	municipality: MunicipalityReference,
	request: MunicipalityMatchRequest,
): boolean {
	return (
		request.latitude >= municipality.bounds.minLat &&
		request.latitude <= municipality.bounds.maxLat &&
		request.longitude >= municipality.bounds.minLng &&
		request.longitude <= municipality.bounds.maxLng
	);
}

function toMunicipality(reference: MunicipalityReference): Municipality {
	return {
		municipalityId: reference.municipalityId,
		name: reference.name,
	};
}

export function listMunicipalities(
	references: readonly MunicipalityReference[] = MUNICIPALITIES,
): MunicipalityListResponse {
	return {
		municipalities: references
			.map(toMunicipality)
			.sort((left, right) => left.municipalityId.localeCompare(right.municipalityId)),
	};
}

export function matchMunicipality(
	request: MunicipalityMatchRequest,
	references: readonly MunicipalityReference[] = MUNICIPALITIES,
): MunicipalityMatchResponse {
	const matches = references
		.filter((municipality) => containsPoint(municipality, request))
		.map((municipality) => ({
			municipality,
			distance: haversineDistanceMeters(request, municipality.centroid),
		}))
		.sort(
			(left, right) =>
				left.distance - right.distance ||
				left.municipality.municipalityId.localeCompare(
					right.municipality.municipalityId,
				),
		);

	const match = matches[0]?.municipality;

	if (!match) {
		return {
			municipalityId: null,
			municipalityName: null,
			matched: false,
		};
	}

	return {
		municipalityId: match.municipalityId,
		municipalityName: match.name,
		matched: true,
	};
}

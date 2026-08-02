import type {
	DemoShelterNearbyRequest,
	DemoShelterNearbyResponse,
} from "@nikuman-yummy/shared";
import { apiPost } from "../../../lib/api/client";

export function getDemoShelters(
	request: DemoShelterNearbyRequest,
	signal?: AbortSignal,
): Promise<DemoShelterNearbyResponse> {
	return apiPost<DemoShelterNearbyRequest, DemoShelterNearbyResponse>(
		"/api/demo/shelters/nearby",
		request,
		{ signal },
	);
}

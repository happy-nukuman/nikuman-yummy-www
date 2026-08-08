"use client";

import { useMutation } from "@tanstack/react-query";
import type { DemoShelterNearbyRequest } from "@nikuman-yummy/shared";
import { getDemoShelters } from "../api/get-demo-shelters";

export function useDemoShelters() {
	return useMutation({
		mutationKey: ["demo-shelters-nearby"],
		mutationFn: (request: DemoShelterNearbyRequest) => getDemoShelters(request),
	});
}

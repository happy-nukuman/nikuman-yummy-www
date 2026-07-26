import type { DemoAlertCreateRequest, DisasterAlert } from "@nikuman-yummy/shared";
import {
	DEMO_ALERT_DEFAULT_TITLES,
	DEMO_ALERT_SOURCE_NAME,
} from "../config/alerts";
import type { DemoAlertRepository } from "../repositories/demo-alert-repository";

// Enough of a UUID to keep repeated demo triggers distinguishable while staying
// short enough to read out loud during a live demo.
const DEMO_ALERT_ID_SUFFIX_LENGTH = 8;

/**
 * Pure demo alert builder. A caller-supplied title is stored as-is; the default
 * titles always carry the (デモ)/(demo)/(演示) suffix.
 */
export function buildDemoAlert(
	request: DemoAlertCreateRequest,
	now: Date,
	uniqueId: string,
): DisasterAlert {
	return {
		id: `demo-${request.type}-${uniqueId.slice(0, DEMO_ALERT_ID_SUFFIX_LENGTH)}`,
		type: request.type,
		title: request.title ?? DEMO_ALERT_DEFAULT_TITLES[request.type],
		issuedAt: now.toISOString(),
		source: DEMO_ALERT_SOURCE_NAME,
	};
}

export class DemoAlertService {
	constructor(
		private readonly repository: DemoAlertRepository,
		private readonly clock: () => Date = () => new Date(),
		private readonly uniqueId: () => string = () => crypto.randomUUID(),
	) {}

	async create(request: DemoAlertCreateRequest): Promise<DisasterAlert> {
		const alert = buildDemoAlert(request, this.clock(), this.uniqueId());
		await this.repository.create(alert);
		return alert;
	}

	async clear(): Promise<number> {
		return await this.repository.clear();
	}
}

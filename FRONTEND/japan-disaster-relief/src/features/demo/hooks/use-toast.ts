"use client";

import { useCallback, useRef, useState } from "react";

const TOAST_DURATION_MS = 1800;

export function useToast() {
	const [toast, setToast] = useState({ msg: "", show: false });
	const timer = useRef<number | undefined>(undefined);

	const notify = useCallback((msg: string) => {
		setToast({ msg, show: true });
		window.clearTimeout(timer.current);
		timer.current = window.setTimeout(
			() => setToast((prev) => ({ ...prev, show: false })),
			TOAST_DURATION_MS,
		);
	}, []);

	return { toast, notify };
}

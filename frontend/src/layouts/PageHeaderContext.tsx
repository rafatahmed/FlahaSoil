/**
 * FlahaSOIL v2 — page header context (Phase 8C-A).
 *
 * Bridges per-page metadata into the shell's top app bar and breadcrumb
 * strip. Pages call `usePageHeader({ title, subtitle, breadcrumbs,
 * projectContext })` once their data is available; the shell subscribes
 * and renders accordingly.
 *
 * Setting headers in an effect keeps render pure: navigating away clears
 * the previous header automatically via the effect cleanup.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
	label: string;
	to?: string;
}

export interface PageProjectContext {
	id: string;
	name: string;
	code?: string;
}

export interface PageHeaderState {
	title: string;
	subtitle?: string;
	breadcrumbs?: BreadcrumbItem[];
	projectContext?: PageProjectContext;
}

interface PageHeaderContextValue {
	header: PageHeaderState;
	setHeader: (h: PageHeaderState | null) => void;
}

const DEFAULT_HEADER: PageHeaderState = {
	title: "FlahaSOIL",
};

const PageHeaderContext = createContext<PageHeaderContextValue>({
	header: DEFAULT_HEADER,
	setHeader: () => undefined,
});

export function PageHeaderProvider({ children }: { children: ReactNode }) {
	const [header, setHeaderState] = useState<PageHeaderState>(DEFAULT_HEADER);
	const value = useMemo<PageHeaderContextValue>(
		() => ({
			header,
			setHeader: (h) => setHeaderState(h ?? DEFAULT_HEADER),
		}),
		[header]
	);
	return (
		<PageHeaderContext.Provider value={value}>
			{children}
		</PageHeaderContext.Provider>
	);
}

export function usePageHeaderState(): PageHeaderState {
	return useContext(PageHeaderContext).header;
}

/**
 * Pages call this hook once their data is ready. The header resets to
 * the default ("FlahaSOIL") when the page unmounts.
 */
export function usePageHeader(header: PageHeaderState): void {
	const { setHeader } = useContext(PageHeaderContext);
	const key = JSON.stringify(header);
	useEffect(() => {
		setHeader(header);
		return () => setHeader(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);
}

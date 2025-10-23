import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import client components
const CompareContainer = dynamic(() => import("@/routes/main/properties/compare"), {
	ssr: true,
});

export const metadata: Metadata = {
	title: "Compare Properties",
	description: "Compare properties side by side to make a better decision.",
};

export default function ComparePage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<CompareContainer />
		</Suspense>
	);
}

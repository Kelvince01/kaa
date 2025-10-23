import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamic imports to handle client components
const PropertiesContainer = dynamic(() => import("@/routes/main/properties"), {
	ssr: true,
});

export const metadata: Metadata = {
	title: "Rental Properties | Kaa",
	description:
		"Browse rental properties available across the UK. Filter by location, price, and features.",
};

export default function PropertiesPage() {
	return <PropertiesContainer />;
}

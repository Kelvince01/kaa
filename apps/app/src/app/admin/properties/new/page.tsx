import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import client components
const AdminNewPropertyClient = dynamic(() => import("@/routes/admin/properties/new-property"), {
	ssr: true,
});

export const metadata: Metadata = {
	title: "Add New Property | Admin",
	description: "Add a new property to the system.",
};

export default function AdminNewPropertyPage() {
	return <AdminNewPropertyClient />;
}

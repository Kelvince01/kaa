import type { Metadata } from "next";
import AdvancedPropertySearch from "@/routes/main/properties/search";

export const metadata: Metadata = {
  title: "Property Search | Kaa",
  description:
    "Search for properties across County. Filter by location, price, and features.",
};

export default function PropertySearchPage() {
  return <AdvancedPropertySearch />;
}

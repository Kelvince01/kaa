"use client";

import { toast } from "sonner";
import { useProperties } from "@/modules/properties";
import { PropertyCompare } from "@/modules/properties/components/compare";
import type { Property } from "@/modules/properties/property.type";

const PropertyComparisonContainer: React.FC = () => {
  // Mock data - replace with your actual property data
  // const mockProperties: Property[] = [
  // 	{
  // 		_id: "1",
  // 		title: "Modern 2BR Apartment in Westlands",
  // 		description: "Beautiful modern apartment with city views",
  // 		memberId: "user1",
  // 		type: "apartment",
  // 		listingType: "rent",
  // 		status: "active",
  // 		available: true,
  // 		availableFrom: "2024-01-01",
  // 		pricing: {
  // 			rentAmount: 85000,
  // 			currency: "KES",
  // 			paymentFrequency: "monthly",
  // 			securityDeposit: 170000,
  // 			serviceCharge: 5000,
  // 			waterBill: "Included",
  // 			electricityBill: "Tenant pays",
  // 			utilitiesIncluded: ["water", "security"],
  // 			negotiable: true,
  // 		},
  // 		location: {
  // 			country: "Kenya",
  // 			county: "Nairobi",
  // 			constituency: "Westlands",
  // 			address: {
  // 				line1: "123 Westlands Road",
  // 				town: "Nairobi",
  // 				postalCode: "00100",
  // 			},
  // 			neighborhood: "Westlands",
  // 		},
  // 		details: {
  // 			rooms: 3,
  // 			bedrooms: 2,
  // 			bathrooms: 2,
  // 			size: 120,
  // 			furnished: true,
  // 			furnishedStatus: "Furnished",
  // 			parking: true,
  // 			garden: false,
  // 			security: true,
  // 			generator: true,
  // 			borehole: false,
  // 			water: true,
  // 			electricity: true,
  // 			internetReady: true,
  // 			petFriendly: false,
  // 			smokingAllowed: false,
  // 			sublettingAllowed: false,
  // 			yearBuilt: 2020,
  // 		},
  // 		media: {
  // 			photos: [
  // 				{
  // 					url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500",
  // 					caption: "Living room",
  // 					isPrimary: true,
  // 				},
  // 			],
  // 		},
  // 		features: ["balcony", "gym", "pool"],
  // 		amenities: [
  // 			{ name: "Swimming Pool", icon: "🏊", description: "Outdoor pool" },
  // 			{ name: "Gym", icon: "💪", description: "Fully equipped gym" },
  // 			{ name: "Parking", icon: "🚗", description: "Secure parking" },
  // 		],
  // 		geolocation: {
  // 			type: "Point",
  // 			coordinates: [-1.2921, 36.8219],
  // 		},
  // 		landlord: {
  // 			_id: "landlord1",
  // 			firstName: "John",
  // 			lastName: "Doe",
  // 			email: "john@example.com",
  // 			phone: "+254700000000",
  // 			role: "landlord",
  // 		} as any,
  // 		createdAt: "2024-01-01T00:00:00Z",
  // 		updatedAt: "2024-01-01T00:00:00Z",
  // 	},
  // 	// Add more mock properties as needed...
  // ];

  const { data } = useProperties();

  const handlePropertiesChange = (properties: Property[]) => {
    console.log("Selected properties:", properties);
    // Handle the property selection change
    // You might want to update URL params, save to localStorage, etc.
  };

  const handleShare = (properties: Property[]) => {
    // Implement sharing functionality
    // You could generate a shareable URL, open share modal, etc.
    console.log("Sharing properties:", properties);

    // Example: Generate shareable URL
    const propertyIds = properties.map((p) => p._id).join(",");
    const shareableUrl = `${window.location.origin}/properties/compare?ids=${propertyIds}`;

    // Copy to clipboard or open share modal
    navigator.clipboard.writeText(shareableUrl);
    toast.info("Comparison link copied to clipboard!");
  };

  return (
    <div className="container mx-auto py-8">
      <PropertyCompare
        // Initial properties to compare (optional)
        availableProperties={data?.properties || []}
        // Maximum number of properties that can be compared
        initialProperties={[]}
        // Whether to show the property selector
        maxProperties={4}
        // Available properties for selection
        onPropertiesChange={handlePropertiesChange}
        // Callback when properties change
        onShare={handleShare}
        // Callback when comparison is shared
        showSelector={true}
        // Whether to show similar properties suggestions
        showSimilarProperties={true}

        // Custom comparison fields (optional)
        // customFields={[...]} // Use default fields if not provided
      />
    </div>
  );
};

export default PropertyComparisonContainer;

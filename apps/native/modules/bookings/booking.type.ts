import type { Property } from "$/modules/properties/property.type";

export type Booking = {
  id: string;
  propertyId: string;
  property: Property;
  tenantId: string;
  landlordId: string;
  viewingDate: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
};

// Unit status
export enum UnitStatus {
  VACANT = "vacant",
  OCCUPIED = "occupied",
  MAINTENANCE = "maintenance",
  RESERVED = "reserved",
  UNAVAILABLE = "unavailable",
}

export enum UnitType {
  BEDSITTER = "bedsitter",
  SINGLE_ROOM = "single_room",
  DOUBLE_ROOM = "double_room",
  STUDIO = "studio",
  ONE_BEDROOM = "one_bedroom",
  TWO_BEDROOM = "two_bedroom",
  THREE_BEDROOM = "three_bedroom",
  PENTHOUSE = "penthouse",
  SHOP = "shop",
  OFFICE = "office",
  WAREHOUSE = "warehouse",
  OTHER = "other",
}

export type UnitAmenity = {
  name: string;
  icon?: string;
  description?: string;
};

export type UnitUtility = {
  name: string;
  included: boolean;
  amount?: number;
  paymentFrequency?: string;
  meterNumber?: string;
  provider?: string;
};

export type Unit = {
  _id: string;
  unitNumber: string;
  property: string | any;
  floor?: number;
  size?: number;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  depositAmount: number;
  description?: string;
  type: UnitType;
  status: UnitStatus;
  amenities?: UnitAmenity[];
  utilities?: UnitUtility[];
  images?: Array<{
    url: string;
    key: string;
    isMain?: boolean;
  }>;
  currentTenant?: string | any;
  leaseStartDate?: string;
  leaseEndDate?: string;
  lastMaintenanceDate?: string;
  nextInspectionDate?: string;
  notes?: string;
  isActive: boolean;
  rentDueDay: number;
  waterMeterReading?: number;
  electricityMeterReading?: number;
  lastMeterReadingDate?: string;
  meterReadingFrequency?: string;
  nextRentDueDate?: string;
  daysUntilRentDue?: number;
};

export type UnitCreateInput = {
  unitNumber: string;
  property: string;
  floor?: number;
  size?: number;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  depositAmount: number;
  description?: string;
  type: UnitType;
  amenities?: UnitAmenity[];
  utilities?: UnitUtility[];
  images?: Array<{
    url: string;
    key: string;
    isMain?: boolean;
  }>;
  notes?: string;
  rentDueDay: number;
};

export type UnitUpdateInput = {
  unitNumber?: string;
  property?: string;
  floor?: number;
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  rent?: number;
  depositAmount?: number;
  description?: string;
  unitType?: UnitType;
  amenities?: UnitAmenity[];
  utilities?: UnitUtility[];
  images?: Array<{
    url: string;
    key: string;
    isMain?: boolean;
  }>;
  notes?: string;
  rentDueDay?: number;
  status?: UnitStatus;
};

export type UnitListResponse = {
  items: Unit[];
  pagination: {
    pages: number;
    total: number;
    page: number;
    limit: number;
  };
  meta: {
    active: number;
    vacant: number;
    occupied: number;
  };
  status: "success" | "error";
  message?: string;
};

export type UnitResponse = {
  data: Unit;
  status: "success" | "error";
  message?: string;
};

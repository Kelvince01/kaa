import {
  differenceInDays,
  format,
  formatDistanceToNow,
  isAfter,
} from "date-fns";
import { type Unit, UnitStatus, UnitType } from "../unit.type";

// Format currency for rent display
export const formatCurrency = (amount: number, currency = "KES") =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
  }).format(amount);

// Format date for display
export const formatDate = (dateString: string) =>
  format(new Date(dateString), "MMM dd, yyyy");

// Format date and time for display
export const formatDateTime = (dateString: string) =>
  format(new Date(dateString), "MMM dd, yyyy 'at' HH:mm");

// Get relative time (e.g., "2 days ago")
export const getRelativeTime = (dateString: string) =>
  formatDistanceToNow(new Date(dateString), { addSuffix: true });

// Check if rent is overdue
export const isRentOverdue = (unit: Unit) => {
  if (!unit.nextRentDueDate || unit.status !== UnitStatus.OCCUPIED)
    return false;
  return isAfter(new Date(), new Date(unit.nextRentDueDate));
};

// Check if rent is due soon (within 7 days)
export const isRentDueSoon = (unit: Unit) => {
  if (!unit.nextRentDueDate || unit.status !== UnitStatus.OCCUPIED)
    return false;
  const daysUntilDue = differenceInDays(
    new Date(unit.nextRentDueDate),
    new Date()
  );
  return daysUntilDue >= 0 && daysUntilDue <= 7;
};

// Get status badge variant
export const getStatusBadgeVariant = (status: UnitStatus) => {
  switch (status) {
    case UnitStatus.VACANT:
      return "secondary" as const;
    case UnitStatus.OCCUPIED:
      return "default" as const;
    case UnitStatus.MAINTENANCE:
      return "destructive" as const;
    case UnitStatus.RESERVED:
      return "outline" as const;
    case UnitStatus.UNAVAILABLE:
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

// Get unit type display name
export const getUnitTypeDisplayName = (type: UnitType) => {
  switch (type) {
    case UnitType.BEDSITTER:
      return "Bedsitter";
    case UnitType.SINGLE_ROOM:
      return "Single Room";
    case UnitType.DOUBLE_ROOM:
      return "Double Room";
    case UnitType.STUDIO:
      return "Studio";
    case UnitType.ONE_BEDROOM:
      return "1 Bedroom";
    case UnitType.TWO_BEDROOM:
      return "2 Bedroom";
    case UnitType.THREE_BEDROOM:
      return "3 Bedroom";
    case UnitType.PENTHOUSE:
      return "Penthouse";
    case UnitType.SHOP:
      return "Shop";
    case UnitType.OFFICE:
      return "Office";
    case UnitType.WAREHOUSE:
      return "Warehouse";
    case UnitType.OTHER:
      return "Other";
    default:
      return "Unknown";
  }
};

// Get status display name
export const getStatusDisplayName = (status: UnitStatus) => {
  switch (status) {
    case UnitStatus.VACANT:
      return "Vacant";
    case UnitStatus.OCCUPIED:
      return "Occupied";
    case UnitStatus.MAINTENANCE:
      return "Maintenance";
    case UnitStatus.RESERVED:
      return "Reserved";
    case UnitStatus.UNAVAILABLE:
      return "Unavailable";
    default:
      return "Unknown";
  }
};

// Filter units by status
export const filterUnitsByStatus = (units: Unit[], status: UnitStatus) =>
  units.filter((unit) => unit.status === status);

// Filter units by type
export const filterUnitsByType = (units: Unit[], type: UnitType) =>
  units.filter((unit) => unit.type === type);

// Search units by text
export const searchUnits = (units: Unit[], searchTerm: string) => {
  const lowercaseSearch = searchTerm.toLowerCase();
  return units.filter(
    (unit) =>
      unit.unitNumber.toLowerCase().includes(lowercaseSearch) ||
      unit.description?.toLowerCase().includes(lowercaseSearch) ||
      getUnitTypeDisplayName(unit.type)
        .toLowerCase()
        .includes(lowercaseSearch) ||
      (typeof unit.property === "string"
        ? unit.property.toLowerCase().includes(lowercaseSearch)
        : unit.property?.title?.toLowerCase().includes(lowercaseSearch))
  );
};

// Get unit statistics
export const getUnitStats = (units: Unit[]) => {
  const total = units.length;
  const vacant = filterUnitsByStatus(units, UnitStatus.VACANT).length;
  const occupied = filterUnitsByStatus(units, UnitStatus.OCCUPIED).length;
  const maintenance = filterUnitsByStatus(units, UnitStatus.MAINTENANCE).length;
  const reserved = filterUnitsByStatus(units, UnitStatus.RESERVED).length;
  const unavailable = filterUnitsByStatus(units, UnitStatus.UNAVAILABLE).length;

  const rentOverdue = units.filter(isRentOverdue).length;
  const rentDueSoon = units.filter(isRentDueSoon).length;

  const totalRentRevenue = units
    .filter((unit) => unit.status === UnitStatus.OCCUPIED)
    .reduce((sum, unit) => sum + unit.rent, 0);

  const potentialRevenue = units
    .filter((unit) => unit.status === UnitStatus.VACANT)
    .reduce((sum, unit) => sum + unit.rent, 0);

  const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;
  const avgRent =
    total > 0 ? units.reduce((sum, unit) => sum + unit.rent, 0) / total : 0;

  return {
    total,
    vacant,
    occupied,
    maintenance,
    reserved,
    unavailable,
    rentOverdue,
    rentDueSoon,
    totalRentRevenue,
    potentialRevenue,
    occupancyRate: Number(occupancyRate.toFixed(1)),
    avgRent: Number(avgRent.toFixed(0)),
  };
};

// Sort units by rent (highest first)
export const sortUnitsByRent = (
  units: Unit[],
  order: "asc" | "desc" = "desc"
) =>
  [...units].sort((a, b) =>
    order === "desc" ? b.rent - a.rent : a.rent - b.rent
  );

// Sort units by unit number
export const sortUnitsByNumber = (units: Unit[]) => {
  return [...units].sort((a, b) => {
    // Try to sort numerically if possible
    const aNum = Number.parseInt(a.unitNumber.replace(/\D/g, ""), 10);
    const bNum = Number.parseInt(b.unitNumber.replace(/\D/g, ""), 10);

    if (!(Number.isNaN(aNum) || Number.isNaN(bNum))) {
      return aNum - bNum;
    }

    // Fallback to string comparison
    return a.unitNumber.localeCompare(b.unitNumber);
  });
};

// Calculate days until rent due
export const getDaysUntilRentDue = (unit: Unit) => {
  if (!unit.nextRentDueDate || unit.status !== UnitStatus.OCCUPIED) return null;
  return differenceInDays(new Date(unit.nextRentDueDate), new Date());
};

// Generate unit display title
export const getUnitDisplayTitle = (unit: Unit) => {
  const property =
    typeof unit.property === "string"
      ? { title: unit.property }
      : unit.property;

  return `Unit ${unit.unitNumber} - ${property?.title || "Unknown Property"}`;
};

// Calculate total deposit required
export const getTotalDepositAmount = (unit: Unit) => {
  // Typically first month + security deposit
  return unit.rent + unit.depositAmount;
};

// Validate unit form data
export const validateUnitData = (data: any) => {
  const errors: Record<string, string> = {};

  if (!data.unitNumber?.trim()) {
    errors.unitNumber = "Unit number is required";
  }

  if (!data.property) {
    errors.property = "Property is required";
  }

  if (!data.unitType) {
    errors.type = "Unit type is required";
  }

  if (!data.rent || data.rent < 0) {
    errors.rent = "Rent amount is required and must be positive";
  }

  if (!data.depositAmount || data.depositAmount < 0) {
    errors.depositAmount = "Deposit amount is required and must be positive";
  }

  if (data.bedrooms === undefined || data.bedrooms < 0) {
    errors.bedrooms = "Number of bedrooms is required";
  }

  if (data.bathrooms === undefined || data.bathrooms < 0) {
    errors.bathrooms = "Number of bathrooms is required";
  }

  if (
    data.rentDueDay === undefined ||
    data.rentDueDay < 1 ||
    data.rentDueDay > 31
  ) {
    errors.rentDueDay = "Rent due day must be between 1 and 31";
  }

  if (data.size && data.size < 0) {
    errors.size = "Unit size must be positive";
  }

  if (data.floor && data.floor < 0) {
    errors.floor = "Floor number must be positive";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Get unit amenities summary
export const getAmenitiesSummary = (unit: Unit) => {
  if (!unit.amenities || unit.amenities.length === 0) {
    return "No amenities listed";
  }

  if (unit.amenities.length <= 3) {
    return unit.amenities.map((a) => a.name).join(", ");
  }

  return `${unit.amenities
    .slice(0, 3)
    .map((a) => a.name)
    .join(", ")}, +${unit.amenities.length - 3} more`;
};

// Get utilities summary
export const getUtilitiesSummary = (unit: Unit) => {
  if (!unit.utilities || unit.utilities.length === 0) {
    return "No utilities information";
  }

  const included = unit.utilities.filter((u) => u.included);
  const notIncluded = unit.utilities.filter((u) => !u.included);

  const summary: string[] = [];

  if (included.length > 0) {
    summary.push(`${included.map((u) => u.name).join(", ")} included`);
  }

  if (notIncluded.length > 0) {
    summary.push(`${notIncluded.map((u) => u.name).join(", ")} separate`);
  }

  return summary.join("; ") || "Utilities information available";
};

// Check if unit is available for rent
export const isUnitAvailable = (unit: Unit) =>
  unit.isActive && unit.status === UnitStatus.VACANT;

// Get rent collection summary for a unit
export const getRentCollectionSummary = (unit: Unit) => {
  if (unit.status !== UnitStatus.OCCUPIED) {
    return "Not applicable - unit not occupied";
  }

  const daysUntilDue = getDaysUntilRentDue(unit);

  if (daysUntilDue === null) {
    return "No rent due date set";
  }

  if (daysUntilDue < 0) {
    return `Rent overdue by ${Math.abs(daysUntilDue)} days`;
  }

  if (daysUntilDue === 0) {
    return "Rent due today";
  }

  if (daysUntilDue <= 7) {
    return `Rent due in ${daysUntilDue} days`;
  }

  return `Next rent due: ${formatDate(unit.nextRentDueDate || "")}`;
};

// Generate unit summary text
export const generateUnitSummary = (unit: Unit) => {
  const typeDisplay = getUnitTypeDisplayName(unit.type);
  const rentDisplay = formatCurrency(unit.rent);
  const statusDisplay = getStatusDisplayName(unit.status);

  return `${typeDisplay} - ${rentDisplay}/month - ${statusDisplay}`;
};

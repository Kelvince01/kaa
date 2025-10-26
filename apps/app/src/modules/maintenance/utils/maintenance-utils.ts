import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";
import {
  type Maintenance,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from "../maintenance.type";

// Format currency for cost display
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

// Check if maintenance is overdue
export const isMaintenanceOverdue = (maintenance: Maintenance) => {
  if (!maintenance.scheduledDate) return false;
  return (
    maintenance.status !== MaintenanceStatus.COMPLETED &&
    isAfter(new Date(), new Date(maintenance.scheduledDate))
  );
};

// Check if maintenance is due soon (within 7 days)
export const isMaintenanceDueSoon = (maintenance: Maintenance) => {
  if (!maintenance.scheduledDate) return false;
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  return (
    maintenance.status !== MaintenanceStatus.COMPLETED &&
    isBefore(new Date(maintenance.scheduledDate), sevenDaysFromNow) &&
    isAfter(new Date(maintenance.scheduledDate), new Date())
  );
};

// Get status badge variant
export const getStatusBadgeVariant = (status: MaintenanceStatus) => {
  switch (status) {
    case MaintenanceStatus.COMPLETED:
      return "default" as const;
    case MaintenanceStatus.IN_PROGRESS:
      return "secondary" as const;
    case MaintenanceStatus.SCHEDULED:
      return "outline" as const;
    case MaintenanceStatus.PENDING:
      return "secondary" as const;
    case MaintenanceStatus.CANCELLED:
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

// Get priority badge variant
export const getPriorityBadgeVariant = (priority: MaintenancePriority) => {
  switch (priority) {
    case MaintenancePriority.EMERGENCY:
      return "destructive" as const;
    case MaintenancePriority.HIGH:
      return "destructive" as const;
    case MaintenancePriority.MEDIUM:
      return "secondary" as const;
    case MaintenancePriority.LOW:
      return "outline" as const;
    default:
      return "outline" as const;
  }
};

// Get maintenance type display name
export const getMaintenanceTypeDisplayName = (type: MaintenanceType) => {
  switch (type) {
    case MaintenanceType.PLUMBING:
      return "Plumbing";
    case MaintenanceType.ELECTRICAL:
      return "Electrical";
    case MaintenanceType.HEATING:
      return "Heating";
    case MaintenanceType.APPLIANCE:
      return "Appliance";
    case MaintenanceType.STRUCTURAL:
      return "Structural";
    case MaintenanceType.PEST_CONTROL:
      return "Pest Control";
    case MaintenanceType.CLEANING:
      return "Cleaning";
    case MaintenanceType.GENERAL:
      return "General";
    case MaintenanceType.OTHER:
      return "Other";
    default:
      return "Unknown";
  }
};

// Get priority display name
export const getPriorityDisplayName = (priority: MaintenancePriority) => {
  switch (priority) {
    case MaintenancePriority.EMERGENCY:
      return "Emergency";
    case MaintenancePriority.HIGH:
      return "High";
    case MaintenancePriority.MEDIUM:
      return "Medium";
    case MaintenancePriority.LOW:
      return "Low";
    default:
      return "Unknown";
  }
};

// Get status display name
export const getStatusDisplayName = (status: MaintenanceStatus) => {
  switch (status) {
    case MaintenanceStatus.PENDING:
      return "Pending";
    case MaintenanceStatus.SCHEDULED:
      return "Scheduled";
    case MaintenanceStatus.IN_PROGRESS:
      return "In Progress";
    case MaintenanceStatus.COMPLETED:
      return "Completed";
    case MaintenanceStatus.CANCELLED:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

// Filter maintenance by status
export const filterMaintenanceByStatus = (
  maintenances: Maintenance[],
  status: MaintenanceStatus
) => maintenances.filter((maintenance) => maintenance.status === status);

// Filter maintenance by priority
export const filterMaintenanceByPriority = (
  maintenances: Maintenance[],
  priority: MaintenancePriority
) => maintenances.filter((maintenance) => maintenance.priority === priority);

// Filter maintenance by type
export const filterMaintenanceByType = (
  maintenances: Maintenance[],
  type: MaintenanceType
) => maintenances.filter((maintenance) => maintenance.maintenanceType === type);

// Search maintenance by text
export const searchMaintenance = (
  maintenances: Maintenance[],
  searchTerm: string
) => {
  const lowercaseSearch = searchTerm.toLowerCase();
  return maintenances.filter(
    (maintenance) =>
      maintenance.title.toLowerCase().includes(lowercaseSearch) ||
      maintenance.description.toLowerCase().includes(lowercaseSearch) ||
      maintenance.workOrderNumber?.toLowerCase().includes(lowercaseSearch) ||
      maintenance.assignedContractor?.name
        .toLowerCase()
        .includes(lowercaseSearch) ||
      maintenance.assignedContractor?.company
        ?.toLowerCase()
        .includes(lowercaseSearch)
  );
};

// Get maintenance statistics
export const getMaintenanceStats = (maintenances: Maintenance[]) => {
  const total = maintenances.length;
  const pending = filterMaintenanceByStatus(
    maintenances,
    MaintenanceStatus.PENDING
  ).length;
  const inProgress = filterMaintenanceByStatus(
    maintenances,
    MaintenanceStatus.IN_PROGRESS
  ).length;
  const completed = filterMaintenanceByStatus(
    maintenances,
    MaintenanceStatus.COMPLETED
  ).length;
  const overdue = maintenances.filter(isMaintenanceOverdue).length;
  const dueSoon = maintenances.filter(isMaintenanceDueSoon).length;

  const totalCost = maintenances
    .filter((maintenance) => maintenance.cost)
    .reduce((sum, maintenance) => sum + (maintenance.cost || 0), 0);

  const estimatedCost = maintenances
    .filter((maintenance) => maintenance.estimatedCost)
    .reduce((sum, maintenance) => sum + (maintenance.estimatedCost || 0), 0);

  return {
    total,
    pending,
    inProgress,
    completed,
    overdue,
    dueSoon,
    totalCost,
    estimatedCost,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
  };
};

// Sort maintenance by priority (emergency first)
export const sortMaintenanceByPriority = (maintenances: Maintenance[]) => {
  const priorityOrder = {
    [MaintenancePriority.EMERGENCY]: 4,
    [MaintenancePriority.HIGH]: 3,
    [MaintenancePriority.MEDIUM]: 2,
    [MaintenancePriority.LOW]: 1,
  };

  return [...maintenances].sort(
    (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
  );
};

// Sort maintenance by date (newest first)
export const sortMaintenanceByDate = (
  maintenances: Maintenance[],
  dateField:
    | "statusUpdatedAt"
    | "scheduledDate"
    | "completedDate" = "statusUpdatedAt"
) =>
  [...maintenances].sort((a, b) => {
    const dateA = a[dateField];
    const dateB = b[dateField];

    if (!(dateA || dateB)) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

// Generate work order number
export const generateWorkOrderNumber = () => {
  const prefix = "WO";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Validate maintenance form data
export const validateMaintenanceData = (data: any) => {
  const errors: Record<string, string> = {};

  if (!data.title?.trim()) {
    errors.title = "Title is required";
  }

  if (!data.description?.trim()) {
    errors.description = "Description is required";
  }

  if (!data.property) {
    errors.property = "Property is required";
  }

  if (!data.maintenanceType) {
    errors.maintenanceType = "Maintenance type is required";
  }

  if (!data.priority) {
    errors.priority = "Priority is required";
  }

  if (data.estimatedCost && data.estimatedCost < 0) {
    errors.estimatedCost = "Estimated cost cannot be negative";
  }

  if (data.cost && data.cost < 0) {
    errors.cost = "Cost cannot be negative";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

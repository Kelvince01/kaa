import { Payment } from "@kaa/models";
import type { IPayment, PaymentFilters } from "@kaa/models/types";
import { UnauthorizedError } from "@kaa/utils";
import type { FilterQuery } from "mongoose";

export type PaymentsResponse = {
  payments: IPayment[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
};

export const getPayments = async (
  filters: PaymentFilters & {
    userRole?: string;
    userId?: string;
  }
): Promise<PaymentsResponse> => {
  try {
    // Parse query parameters
    const {
      status,
      paymentType,
      propertyId,
      startDate,
      endDate,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
      userRole,
      userId,
    } = filters;

    // Build filter
    const filter: FilterQuery<IPayment> = {};

    // Apply role-based filtering
    if (userRole === "tenant") {
      filter.tenant = userId;
    } else if (userRole === "landlord") {
      filter.landlord = userId;
    } else if (userRole !== "admin") {
      throw new UnauthorizedError("Not authorized to view payments");
    }

    // Apply additional filters
    if (status) {
      filter.status = status;
    }

    if (paymentType) {
      filter.paymentType = paymentType;
    }

    if (propertyId) {
      filter.property = propertyId;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        (filter as any).createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        (filter as any).createdAt.$lte = new Date(endDate);
      }
    }

    // Text search
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { referenceNumber: { $regex: search, $options: "i" } },
        { "metadata.notes": { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Convert page and limit to numbers and set defaults
    const pageNum = typeof page === "string" ? Number.parseInt(page, 10) : page;
    const limitNum =
      typeof limit === "string" ? Number.parseInt(limit, 10) : limit;
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Payment.countDocuments(filter);

    // Get paginated results
    const payments = await Payment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("tenant", "firstName lastName email")
      .populate("landlord", "firstName lastName email")
      .populate("property", "title address");

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;

    return {
      payments,
      pagination: {
        total,
        pages: totalPages,
        page: pageNum,
        hasNextPage,
        hasPreviousPage,
        limit: limitNum,
      },
    };
  } catch (error) {
    console.error("Error fetching payments:", error);
    return {
      payments: [],
      pagination: {
        total: 0,
        pages: 0,
        page: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        limit: 0,
      },
    };
  }
};

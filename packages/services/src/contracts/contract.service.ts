import { Contract, Property, Tenant, Unit } from "@kaa/models";
import type { IProperty, ITenant, IUnit, IUser } from "@kaa/models/types";
import {
  ContractStatus,
  ContractType,
  type IContract,
  type ISignature,
} from "@kaa/models/types";
import type { FilterQuery, SortOrder } from "mongoose";
import mongoose from "mongoose";
import {
  type ContractPDFData,
  contractPDFService,
} from "./contract.pdf.service";
import {
  ContractError,
  ContractLogger,
  ContractNotFoundError,
  ContractOverlapError,
  ContractStatusHelpers,
  ContractValidationError,
  ContractValidators,
  DateHelpers,
  PermissionHelpers,
} from "./utils/contract.helpers";

export type ContractCreateData = {
  propertyId: string;
  unitId?: string;
  tenantIds: string[];
  startDate: string;
  endDate: string;
  rentAmount?: number;
  depositAmount?: number;
  serviceCharge?: number;
  lateFee?: number;
  rentDueDate?: number;
  waterBill?: "Included" | "Tenant pays" | "Shared";
  electricityBill?: "Included" | "Tenant pays" | "Shared";
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  sublettingAllowed?: boolean;
  terms?: Array<{ title: string; content: string }>;
  specialConditions?: string[];
  contractType?: ContractType;
  contractTemplate?: string;
  userId: string;
};

export type ContractUpdateData = {
  startDate?: string;
  endDate?: string;
  rentAmount?: number;
  depositAmount?: number;
  serviceCharge?: number;
  lateFee?: number;
  rentDueDate?: number;
  waterBill?: "Included" | "Tenant pays" | "Shared";
  electricityBill?: "Included" | "Tenant pays" | "Shared";
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  sublettingAllowed?: boolean;
  terms?: Array<{ title: string; content: string }>;
  specialConditions?: string[];
  status?: ContractStatus;
};

export type ContractQueryOptions = {
  status?: ContractStatus;
  property?: string;
  unit?: string;
  tenants?: string | string[];
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  page?: number;
  search?: string;
};

export type ContractQueryResult = {
  contracts: IContract[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type ContractSigningData = {
  contractId: string;
  userId: string;
  signatureType: "digital" | "electronic" | "wet";
  signatureData?: string;
  ipAddress?: string;
  userAgent?: string;
  witnessName?: string;
  witnessSignature?: string;
};

export type ContractTerminationData = {
  contractId: string;
  userId: string;
  terminationDate: string;
  terminationReason: string;
  terminationNotice?: string;
  refundableDeposit?: number;
  deductions?: Array<{
    description: string;
    amount: number;
  }>;
  finalInspectionDate?: string;
  finalInspectionNotes?: string;
};

export class ContractService {
  /**
   * Create a new contract
   */
  async createContract(data: ContractCreateData): Promise<IContract> {
    try {
      // Validate input data
      await this.validateContractData(data);

      // Check for overlapping contracts
      await this.checkContractOverlap(
        data.unitId,
        data.startDate,
        data.endDate
      );

      // Fetch and validate related entities
      const { property, unit, tenants } = await this.fetchRelatedEntities(data);

      // Validate user permissions
      await this.validateUserPermissions(data.userId, property);

      // Prepare contract data
      const contractData = await this.prepareContractData(
        data,
        property,
        unit,
        tenants
      );

      // Generate PDF document
      const pdfResult = await this.generateContractPDF(contractData);

      // Create contract in database
      const contract = await this.createContractRecord(
        data,
        property,
        unit,
        tenants,
        pdfResult
      );

      ContractLogger.logContractCreation(
        (contract._id as mongoose.Types.ObjectId).toString(),
        data.userId,
        data.propertyId
      );

      return contract;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        userId: data.userId,
        action: "create_contract",
      });
      throw error;
    }
  }

  /**
   * Update an existing contract
   */
  async updateContract(
    contractId: string,
    data: ContractUpdateData,
    userId: string,
    userRole?: { name: string }
  ): Promise<IContract> {
    try {
      // Find contract
      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new ContractNotFoundError(contractId);
      }

      // Check permissions
      if (
        !PermissionHelpers.canModifyContract(
          { id: userId } as IUser,
          { landlord: contract.landlord.toString(), status: contract.status },
          userRole
        )
      ) {
        throw new ContractError("Not authorized to modify this contract", 403);
      }

      // Validate status change
      if (
        data.status &&
        !ContractStatusHelpers.canModifyContract(contract.status)
      ) {
        throw new ContractValidationError(
          "Cannot modify contract in current status"
        );
      }

      // Validate date changes
      if (data.startDate || data.endDate) {
        const startDate = data.startDate
          ? new Date(data.startDate)
          : contract.startDate;
        const endDate = data.endDate
          ? new Date(data.endDate)
          : contract.endDate;
        DateHelpers.validateContractDates(startDate, endDate);

        // Check for overlaps if dates changed
        if (data.startDate || data.endDate) {
          await this.checkContractOverlap(
            contract.unit?.toString(),
            startDate.toISOString(),
            endDate.toISOString(),
            contractId
          );
        }
      }

      // Update contract
      const updatedContract = await Contract.findByIdAndUpdate(
        contractId,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate([
        { path: "landlord", select: "firstName lastName email phone" },
        { path: "property", select: "title location" },
        { path: "unit", select: "unitNumber unitType" },
        {
          path: "tenants",
          select:
            "personalInfo.firstName personalInfo.lastName personalInfo.email",
        },
      ]);

      if (!updatedContract) {
        throw new ContractNotFoundError(contractId);
      }

      ContractLogger.logStatusChange(
        contractId,
        userId,
        contract.status,
        updatedContract.status
      );

      return updatedContract;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        contractId,
        userId,
        action: "update_contract",
      });
      throw error;
    }
  }

  /**
   * Get contract by ID
   */
  async getContractById(
    contractId: string,
    userId: string,
    userRole?: { name: string }
  ): Promise<IContract> {
    try {
      const contract = await Contract.findById(contractId).populate([
        { path: "landlord", select: "firstName lastName email phone address" },
        { path: "property", select: "title location type" },
        { path: "unit", select: "unitNumber unitType bedrooms bathrooms size" },
        { path: "tenants", select: "personalInfo address" },
      ]);

      if (!contract) {
        throw new ContractNotFoundError(contractId);
      }

      // Check permissions
      if (
        !PermissionHelpers.canAccessContract(
          { id: userId } as IUser,
          {
            landlord: contract.landlord._id?.toString() || "",
            tenants: contract.tenants.map((t) => t._id?.toString() || ""),
          },
          userRole
        )
      ) {
        throw new ContractError("Not authorized to access this contract", 403);
      }

      return contract;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        contractId,
        userId,
        action: "get_contract",
      });
      throw error;
    }
  }

  /**
   * Get contracts with filtering and pagination
   */
  async getContracts(
    options: ContractQueryOptions,
    userId: string,
    userRole?: { name: string }
  ): Promise<ContractQueryResult> {
    try {
      const {
        status,
        property,
        unit,
        tenants,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,
        sortBy = "createdAt",
        sortOrder = "desc",
        limit = 10,
        page = 1,
        search,
      } = options;

      // Build query filter
      const filter: FilterQuery<IContract> = {};

      // Add user-specific filter (non-admin users)
      if (userRole?.name !== "admin") {
        filter.$or = [
          { landlord: new mongoose.Types.ObjectId(userId) },
          { tenants: { $in: [new mongoose.Types.ObjectId(userId)] } },
        ];
      }

      // Add filters
      if (status) filter.status = status;
      if (property) filter.property = new mongoose.Types.ObjectId(property);
      if (unit) filter.unit = new mongoose.Types.ObjectId(unit);
      if (tenants) {
        const tenantIds = Array.isArray(tenants) ? tenants : [tenants];
        filter.tenants = {
          $in: tenantIds.map((id) => new mongoose.Types.ObjectId(id)),
        };
      }

      // Date range filters
      if (startDateFrom || startDateTo) {
        filter.startDate = {};
        if (startDateFrom) filter.startDate.$gte = new Date(startDateFrom);
        if (startDateTo) filter.startDate.$lte = new Date(startDateTo);
      }

      if (endDateFrom || endDateTo) {
        filter.endDate = {};
        if (endDateFrom) filter.endDate.$gte = new Date(endDateFrom);
        if (endDateTo) filter.endDate.$lte = new Date(endDateTo);
      }

      // Search filter
      if (search) {
        filter.$or = [
          { "property.title": { $regex: search, $options: "i" } },
          { "unit.unitNumber": { $regex: search, $options: "i" } },
          {
            "tenants.personalInfo.firstName": { $regex: search, $options: "i" },
          },
          {
            "tenants.personalInfo.lastName": { $regex: search, $options: "i" },
          },
        ];
      }

      // Build sort
      const sort: Record<string, SortOrder> = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [contracts, total] = await Promise.all([
        Contract.find(filter)
          // .select("tenants")
          .populate([
            { path: "landlord", select: "firstName lastName email phone" },
            { path: "property", select: "title location type pricing" },
            { path: "unit", select: "unitNumber unitType" },
            // {
            // path: "tenants",
            // select: "personalInfo.firstName personalInfo.lastName personalInfo.email",
            // },
          ])
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Contract.countDocuments(filter),
      ]);

      return {
        contracts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        userId,
        action: "get_contracts",
      });
      throw error;
    }
  }

  /**
   * Sign a contract
   */
  async signContract(data: ContractSigningData): Promise<IContract> {
    try {
      const contract = await this.getContractById(data.contractId, data.userId);

      if (!ContractStatusHelpers.canSignContract(contract.status)) {
        throw new ContractValidationError(
          "Cannot sign contract in current status"
        );
      }

      // Path to your unsigned PDF template
      // 				const unsignedPdfPath = path.join(
      // 					process.cwd(),
      // 					"templates",
      // 					"tenancy_agreement_template.pdf"
      // 				);

      // 				// Sign the PDF using pdf-lib (recommended approach)
      // 				const signedPdfBuffer = await contractSigningService.signPDFWithPdfLib(
      // 					unsignedPdfPath,
      // 					body.signature,
      // 					body.signatureDate,
      // 					"John Doe", // You might want to get this from the request or database
      // 					{
      // 						x: 200, // Adjust based on your PDF layout
      // 						y: 380, // Signature line position
      // 						width: 200,
      // 						height: 60,
      // 					}
      // 				);

      // 				// Save the signed PDF
      // 				const signedPdfPath = path.join(
      // 					process.cwd(),
      // 					"signed_contracts",
      // 					`contract_${Date.now()}.pdf`
      // 				);
      // 				await fs.writeFile(signedPdfPath, signedPdfBuffer);

      // Create signature record
      const signature: ISignature = {
        signedBy: new mongoose.Types.ObjectId(data.userId),
        signedAt: new Date(),
        signatureType: data.signatureType,
        signatureData: data.signatureData,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        witnessName: data.witnessName,
        witnessSignature: data.witnessSignature,
      };

      // Update contract with signature
      const updatedContract = await Contract.findByIdAndUpdate(
        data.contractId,
        {
          $push: { signatures: signature },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      ).populate([
        { path: "landlord", select: "firstName lastName email phone" },
        { path: "property", select: "title location" },
        { path: "unit", select: "unitNumber unitType" },
        {
          path: "tenants",
          select:
            "personalInfo.firstName personalInfo.lastName personalInfo.email",
        },
      ]);

      if (!updatedContract) {
        throw new ContractNotFoundError(data.contractId);
      }

      // Check if all required parties have signed
      const requiredSignatures = [
        updatedContract.landlord._id?.toString(),
        ...updatedContract.tenants.map((t) => t._id?.toString()),
      ].filter(Boolean);

      const existingSignatures =
        updatedContract.signatures?.map((s) => s.signedBy.toString()) || [];
      const allSigned = requiredSignatures.every((id) =>
        existingSignatures.includes(id)
      );

      // Update status if all signed
      if (allSigned && updatedContract.status === ContractStatus.PENDING) {
        await Contract.findByIdAndUpdate(data.contractId, {
          status: ContractStatus.ACTIVE,
          updatedAt: new Date(),
        });
      }

      ContractLogger.logStatusChange(
        data.contractId,
        data.userId,
        contract.status,
        allSigned ? ContractStatus.ACTIVE : updatedContract.status
      );

      return updatedContract;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        contractId: data.contractId,
        userId: data.userId,
        action: "sign_contract",
      });
      throw error;
    }
  }

  /**
   * Terminate a contract
   */
  async terminateContract(data: ContractTerminationData): Promise<IContract> {
    try {
      const contract = await this.getContractById(data.contractId, data.userId);

      if (!ContractStatusHelpers.canTerminateContract(contract.status)) {
        throw new ContractValidationError(
          "Cannot terminate contract in current status"
        );
      }

      // Validate termination date
      const terminationDate = new Date(data.terminationDate);
      if (terminationDate < new Date()) {
        throw new ContractValidationError(
          "Termination date cannot be in the past"
        );
      }

      // Update contract
      const updatedContract = await Contract.findByIdAndUpdate(
        data.contractId,
        {
          status: ContractStatus.TERMINATED,
          terminationDate,
          terminationReason: data.terminationReason,
          terminationNotice: data.terminationNotice,
          refundableDeposit: data.refundableDeposit,
          deductions: data.deductions,
          finalInspectionDate: data.finalInspectionDate
            ? new Date(data.finalInspectionDate)
            : undefined,
          finalInspectionNotes: data.finalInspectionNotes,
          updatedAt: new Date(),
        },
        { new: true }
      ).populate([
        { path: "landlord", select: "firstName lastName email phone" },
        { path: "property", select: "title location" },
        { path: "unit", select: "unitNumber unitType" },
        {
          path: "tenants",
          select:
            "personalInfo.firstName personalInfo.lastName personalInfo.email",
        },
      ]);

      if (!updatedContract) {
        throw new ContractNotFoundError(data.contractId);
      }

      ContractLogger.logStatusChange(
        data.contractId,
        data.userId,
        contract.status,
        ContractStatus.TERMINATED
      );

      return updatedContract;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        contractId: data.contractId,
        userId: data.userId,
        action: "terminate_contract",
      });
      throw error;
    }
  }

  /**
   * Delete a contract (soft delete)
   */
  async deleteContract(
    contractId: string,
    userId: string,
    userRole?: { name: string }
  ): Promise<void> {
    try {
      const contract = await this.getContractById(contractId, userId, userRole);

      if (
        !PermissionHelpers.canModifyContract(
          { id: userId } as IUser,
          {
            landlord: contract.landlord._id?.toString() || "",
            status: contract.status,
          },
          userRole
        )
      ) {
        throw new ContractError("Not authorized to delete this contract", 403);
      }

      // Soft delete
      await Contract.findByIdAndUpdate(contractId, {
        status: ContractStatus.CANCELLED,
        deletedAt: new Date(),
        updatedAt: new Date(),
      });

      ContractLogger.logStatusChange(
        contractId,
        userId,
        contract.status,
        ContractStatus.CANCELLED
      );
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        contractId,
        userId,
        action: "delete_contract",
      });
      throw error;
    }
  }

  /**
   * Get contracts by property
   */
  async getContractsByUser(userId: string): Promise<IContract[]> {
    try {
      // Fetch contracts where user is a tenant
      const contracts = await Contract.find({
        tenants: { $in: [new mongoose.Types.ObjectId(userId)] },
      })
        .populate("property", "title location images")
        .populate("landlord", "firstName lastName email phone")
        .sort({ createdAt: -1 });

      return contracts;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        userId,
        action: "get_contracts_by_property",
      });
      throw error;
    }
  }

  /**
   * Get contracts by property
   */
  async getContractsByProperty(
    propertyId: string,
    userId: string,
    userRole?: { name: string }
  ): Promise<IContract[]> {
    try {
      // Check if property exists and user has access
      const property = await Property.findById(propertyId);
      if (!property) {
        throw new ContractError("Property not found", 404);
      }

      if (
        property.landlord.toString() !== userId &&
        userRole?.name !== "admin"
      ) {
        throw new ContractError(
          "Not authorized to view contracts for this property",
          403
        );
      }

      // Get contracts
      const contracts = await Contract.find({ property: propertyId })
        .populate([
          { path: "landlord", select: "firstName lastName email phone" },
          { path: "property", select: "title location" },
          { path: "unit", select: "unitNumber unitType" },
          {
            path: "tenants",
            select:
              "personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone",
          },
        ])
        .sort({ createdAt: -1 });

      return contracts;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        userId,
        action: "get_contracts_by_property",
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private validateContractData(data: ContractCreateData): void {
    // Validate dates
    DateHelpers.validateContractDates(
      new Date(data.startDate),
      new Date(data.endDate)
    );

    // Validate rental amounts
    if (data.rentAmount !== undefined || data.depositAmount !== undefined) {
      ContractValidators.validateRentalAmounts({
        rentAmount: data.rentAmount || 0,
        depositAmount: data.depositAmount || 0,
        serviceCharge: data.serviceCharge,
        lateFee: data.lateFee,
      });
    }

    // Validate rent due date
    if (data.rentDueDate !== undefined) {
      ContractValidators.validateRentDueDate(data.rentDueDate);
    }
  }

  private async checkContractOverlap(
    unitId: string | undefined,
    startDate: string,
    endDate: string,
    excludeContractId?: string
  ): Promise<void> {
    if (!unitId) return;

    const filter: FilterQuery<IContract> = {
      unit: new mongoose.Types.ObjectId(unitId),
      status: {
        $in: [
          ContractStatus.ACTIVE,
          ContractStatus.DRAFT,
          ContractStatus.PENDING,
        ],
      },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
    };

    if (excludeContractId) {
      filter._id = { $ne: new mongoose.Types.ObjectId(excludeContractId) };
    }

    const existingContract = await Contract.findOne(filter);
    if (existingContract) {
      throw new ContractOverlapError();
    }
  }

  private async fetchRelatedEntities(data: ContractCreateData): Promise<{
    property: IProperty;
    unit: IUnit | null;
    tenants: ITenant[];
  }> {
    // Fetch property
    const property = await Property.findById(data.propertyId).populate(
      "landlord",
      "firstName lastName email phone address idNumber"
    );

    if (!property) {
      throw new ContractError("Property not found", 404);
    }

    // Fetch unit (if specified)
    let unit: IUnit | null = null;
    if (data.unitId) {
      unit = await Unit.findById(data.unitId);
      if (!unit) {
        throw new ContractError("Unit not found", 404);
      }
    }

    // Fetch tenants
    const tenants = await Tenant.find({
      _id: { $in: data.tenantIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    if (tenants.length !== data.tenantIds.length) {
      throw new ContractError("One or more tenants not found", 404);
    }

    ContractValidators.validateTenants(tenants);

    return { property, unit, tenants };
  }

  private validateUserPermissions(userId: string, property: IProperty): void {
    if (property.landlord.toString() !== userId) {
      throw new ContractError(
        "Not authorized to create contracts for this property",
        403
      );
    }
  }

  private prepareContractData(
    data: ContractCreateData,
    property: IProperty,
    unit: IUnit | null,
    tenants: ITenant[]
  ): ContractPDFData {
    return {
      property,
      unit: unit || undefined,
      tenants,
      startDate: data.startDate,
      endDate: data.endDate,
      rentAmount: data.rentAmount || property.pricing.rent,
      depositAmount: data.depositAmount || property.pricing.deposit,
      serviceCharge:
        data.serviceCharge || (property.pricing.serviceFee as number),
      lateFee: data.lateFee || (property.pricing.lateFee as number),
      // rentDueDate: (data.rentDueDate as number) || (property.pricing.rentDueDate as number),
      rentDueDate: 1,
      // waterBill: data.waterBill || property.pricing.waterBill,
      waterBill: "Tenant pays",
      // electricityBill: data.electricityBill || property.pricing.electricityBill,
      electricityBill: "Tenant pays",
      // electricityBill: data.electricityBill || property.pricing.electricityBill,
      // petsAllowed: data.petsAllowed ?? property.details.petFriendly,
      petsAllowed: false,
      // smokingAllowed: data.smokingAllowed ?? property.details.smokingAllowed,
      smokingAllowed: false,
      // sublettingAllowed: data.sublettingAllowed ?? property.details.sublettingAllowed,
      sublettingAllowed: false,
      // smokingAllowed: data.smokingAllowed ?? property.details.smokingAllowed,
      // sublettingAllowed: data.sublettingAllowed ?? property.details.sublettingAllowed,
      terms: data.terms,
      specialConditions: data.specialConditions,
      contractTemplate: data.contractTemplate as any,
    };
  }

  private async generateContractPDF(data: ContractPDFData) {
    const pdfResult = await contractPDFService.generateContractPDF(data);
    if (!pdfResult.success) {
      throw new ContractError(
        `Failed to generate contract PDF: ${pdfResult.error}`
      );
    }
    return pdfResult;
  }

  private async createContractRecord(
    data: ContractCreateData,
    property: IProperty,
    unit: IUnit | null,
    _tenants: ITenant[],
    pdfResult: { filePath?: string; fileName?: string }
  ): Promise<IContract> {
    const contract = new Contract({
      landlord: property.landlord,
      property: property._id,
      unit: unit?._id,
      tenants: data.tenantIds.map((id) => new mongoose.Types.ObjectId(id)),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      rentAmount: data.rentAmount || property.pricing.rent,
      depositAmount: data.depositAmount || property.pricing.deposit,
      serviceCharge: data.serviceCharge || property.pricing.serviceFee,
      lateFee: data.lateFee || property.pricing.lateFee,
      // rentDueDate: data.rentDueDate || property.pricing.rentDueDate,
      rentDueDate: 1,
      // waterBill: data.waterBill || property.pricing.waterBill,
      waterBill: "Tenant pays",
      // electricityBill: data.electricityBill || property.pricing.electricityBill,
      electricityBill: "Tenant pays",
      // petsAllowed: data.petsAllowed ?? property.details.petFriendly,
      petsAllowed: false,
      // smokingAllowed: data.smokingAllowed ?? property.details.smokingAllowed,
      smokingAllowed: false,
      // sublettingAllowed: data.sublettingAllowed ?? property.details.sublettingAllowed,
      sublettingAllowed: false,
      // waterBill: data.waterBill || property.pricing.waterBill,
      // electricityBill: data.electricityBill || property.pricing.electricityBill,
      // petsAllowed: data.petsAllowed ?? property.details.petFriendly,
      // smokingAllowed: data.smokingAllowed ?? property.details.smokingAllowed,
      // sublettingAllowed: data.sublettingAllowed ?? property.details.sublettingAllowed,
      status: ContractStatus.DRAFT,
      contractType: data.contractType || ContractType.ASSURED_SHORTHAND_TENANCY,
      contractTemplate: data.contractTemplate || "standard",
      contractData: {
        terms: data.terms,
        specialConditions: data.specialConditions,
      },
      contractDocument: pdfResult.fileName
        ? `/uploads/contracts/${pdfResult.fileName}`
        : undefined,
      documents: pdfResult.fileName
        ? [
            {
              name: pdfResult.fileName,
              url: `/uploads/contracts/${pdfResult.fileName}`,
              type: "contract",
              uploadedAt: new Date(),
            },
          ]
        : [],
      paymentSchedule: {
        frequency: "monthly",
        amount: data.rentAmount || property.pricing.rent,
        dueDate: data.rentDueDate || 1, // property.pricing.rentDueDate,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await contract.save();
    return contract;
  }
}

// Export singleton instance
export const contractService = new ContractService();

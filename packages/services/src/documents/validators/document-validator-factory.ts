import { DocumentCategory } from "@kaa/models/types";
import {
  BankStatementValidator,
  UtilityBillValidator,
} from "./address-document-validators";
import {
  type DocumentValidator,
  GenericDocumentValidator,
} from "./document-validator";
import {
  EUIDCardValidator,
  UKPassportValidator,
  USDriversLicenseValidator,
} from "./identity-document-validators";
import {
  EmploymentContractValidator,
  PayslipValidator,
  TaxReturnValidator,
} from "./income-document-validators";

/**
 * Factory class for creating document validators based on document type and category
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class DocumentValidatorFactory {
  /**
   * Create a validator for the specified document type
   * @param documentType The type of document to validate
   * @param documentCategory The category of document
   * @returns An appropriate validator for the document
   */
  static createValidator(
    documentType: string,
    documentCategory: DocumentCategory
  ): DocumentValidator {
    // First try to match by specific document type
    switch (documentType.toLowerCase()) {
      // Identity documents
      case "passport":
      case "uk passport":
      case "british passport":
        return new UKPassportValidator();
      case "driver's license":
      case "drivers license":
      case "driving license":
      case "us driver's license":
        return new USDriversLicenseValidator();
      case "id card":
      case "identity card":
      case "eu id card":
        return new EUIDCardValidator();

      // Address documents
      case "utility bill":
      case "gas bill":
      case "electric bill":
      case "water bill":
      case "phone bill":
      case "internet bill":
        return new UtilityBillValidator();
      case "bank statement":
        return new BankStatementValidator();

      // Income documents
      case "payslip":
      case "pay slip":
      case "wage slip":
      case "salary slip":
        return new PayslipValidator();
      case "employment contract":
      case "contract of employment":
      case "job contract":
        return new EmploymentContractValidator();
      case "tax return":
      case "tax statement":
      case "tax form":
        return new TaxReturnValidator();

      // Default case - fall back to category-based selection
      default:
        return DocumentValidatorFactory.createValidatorByCategory(
          documentCategory
        );
    }
  }

  /**
   * Create a validator based on document category
   * @param category The document category
   * @returns An appropriate validator for the category
   */
  private static createValidatorByCategory(
    category: DocumentCategory
  ): DocumentValidator {
    switch (category) {
      case DocumentCategory.IDENTITY:
        return new UKPassportValidator(); // Default identity validator
      case DocumentCategory.ADDRESS:
        return new UtilityBillValidator(); // Default address validator
      case DocumentCategory.INCOME:
        return new PayslipValidator(); // Default income validator
      case DocumentCategory.REFERENCES:
        return new EmploymentContractValidator(); // Use employment contract validator for references
      case DocumentCategory.GENERAL:
        return new GenericDocumentValidator(); // Fallback to generic validator
      // biome-ignore lint/complexity/noUselessSwitchCase: ignore
      case DocumentCategory.OTHER:
      default:
        return new GenericDocumentValidator(); // Fallback to generic validator
    }
  }
}

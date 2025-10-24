import { ITemplate } from "@kaa/models/types";

const defaultTemplates: Pick<
  ITemplate,
  | "name"
  | "description"
  | "content"
  | "variables"
  | "engine"
  | "format"
  | "version"
  | "isActive"
>[] = [
  {
    name: "Standard Apartment Lease",
    description: "Basic residential lease agreement for apartments",
    content: `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement ("Agreement") is entered into on {{start_date}} between {{landlord_name}} ("Landlord") and {{tenant_name}} ("Tenant").

PROPERTY DETAILS:
Address: {{property_address}}
Property Type: {{property_type}}
Unit: {{unit_number}}

LEASE TERMS:
Lease Period: {{start_date}} to {{end_date}}
Monthly Rent: {{rent_amount}}
Security Deposit: {{deposit_amount}}
Payment Due Date: {{payment_due_date}} of each month

TERMS AND CONDITIONS:
1. The Tenant agrees to pay rent on time each month
2. The property shall be used for residential purposes only
3. No pets allowed without prior written consent
4. Tenant is responsible for utilities unless otherwise specified
5. Property must be maintained in good condition

SIGNATURES:
Landlord: _________________ Date: _______
Tenant: _________________ Date: _______`,
    variables: [
      {
        name: "start_date",
        type: "date",
        description: "The date the lease agreement was signed",
        required: true,
      },
      {
        name: "landlord_name",
        type: "string",
        description: "The name of the landlord",
        required: true,
      },
      {
        name: "tenant_name",
        type: "string",
        description: "The name of the tenant",
        required: true,
      },
      {
        name: "property_address",
        type: "string",
        description: "The address of the property",
        required: true,
      },
      {
        name: "property_type",
        type: "string",
        description: "The type of the property",
        required: true,
      },
      {
        name: "unit_number",
        type: "string",
        description: "The number of the unit",
        required: true,
      },
      {
        name: "end_date",
        type: "date",
        description: "The date the lease agreement ends",
        required: true,
      },
      {
        name: "rent_amount",
        type: "number",
        description: "The amount of rent per month",
        required: true,
      },
      {
        name: "deposit_amount",
        type: "number",
        description: "The amount of deposit",
        required: true,
      },
      {
        name: "payment_due_date",
        type: "date",
        description: "The date the rent is due",
        required: true,
      },
    ],
    engine: "handlebars",
    format: "html",
    version: 1,
    isActive: true,
  },
];

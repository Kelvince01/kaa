import { UnitStatus, UnitType } from "@kaa/models/types";
import { t } from "elysia";

export const createUnitSchema = t.Object({
  unitNumber: t.String(),
  property: t.String(),
  floor: t.Optional(t.Number()),
  size: t.Optional(t.Number()),
  bedrooms: t.Number(),
  bathrooms: t.Number(),
  rent: t.Number(),
  depositAmount: t.Number(),
  description: t.Optional(t.String()),
  type: t.Enum(UnitType),
  status: t.Enum(UnitStatus),
  amenities: t.Optional(
    t.Array(
      t.Object({
        name: t.String(),
        icon: t.String(),
        description: t.String(),
      })
    )
  ),
  utilities: t.Optional(
    t.Array(
      t.Object({
        name: t.String(),
        included: t.Boolean(),
        amount: t.Number(),
        paymentFrequency: t.String(),
        meterNumber: t.String(),
        provider: t.String(),
      })
    )
  ),
  images: t.Optional(
    t.Array(
      t.Object({
        url: t.String(),
        key: t.String(),
        isMain: t.Boolean(),
      })
    )
  ),
  notes: t.Optional(t.String()),
  rentDueDay: t.Number(),
  isActive: t.Boolean(),
  meterReadingFrequency: t.Optional(
    t.Enum({
      MONTHLY: "monthly",
      QUARTERLY: "quarterly",
      BIANNUALLY: "biannually",
      ANNUALLY: "annually",
    })
  ),
});

export const updateUnitSchema = t.Object({
  unitNumber: t.Optional(t.String()),
  property: t.Optional(t.String()),
  floor: t.Optional(t.Number()),
  size: t.Optional(t.Number()),
  bedrooms: t.Optional(t.Number()),
});

export const assignTenantSchema = t.Object({
  tenantId: t.String(),
  leaseStartDate: t.String(),
  leaseEndDate: t.String(),
  depositPaid: t.Boolean(),
  notes: t.String(),
});

export const updateUnitStatusSchema = t.Object({
  status: t.Enum(UnitStatus),
  notes: t.String(),
});

export const updateMeterReadingsSchema = t.Object({
  waterMeterReading: t.Number(),
  electricityMeterReading: t.Number(),
  readingDate: t.String(),
  notes: t.String(),
});

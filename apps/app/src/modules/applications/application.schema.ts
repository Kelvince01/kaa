import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import z from "zod";
import { flagConfig } from "@/config/flag";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";
import { type Application, ApplicationStatus } from "./application.type";

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value)
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<Application>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  title: parseAsString.withDefault(""),
  status: parseAsStringEnum<ApplicationStatus>(
    Object.values(ApplicationStatus)
  ),
  //   estimatedHours: parseAsArrayOf(z.coerce.number()).withDefault([]),
  createdAt: parseAsArrayOf(parseAsInteger).withDefault([]),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export const createApplicationSchema = z.object({
  title: z.string(),
  status: z.enum(Object.values(ApplicationStatus) as [string, ...string[]]),
  estimatedHours: z.coerce.number().optional(),
});

export const updateApplicationSchema = z.object({
  // title: z.string().optional(),
  status: z
    .enum(Object.values(ApplicationStatus) as [string, ...string[]])
    .optional(),
  // estimatedHours: z.coerce.number().optional(),
});

export type GetApplicationsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
export type CreateApplicationSchema = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationSchema = z.infer<typeof updateApplicationSchema>;

export const applicationFormSchema = z.object({
  property: z.string(),
  moveInDate: z.string(),
  offerAmount: z.number().optional(),
  notes: z
    .string()
    .max(1000, "Notes must be at most 1000 characters")
    .optional(),
  documents: z.array(z.string()).optional(),
});

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

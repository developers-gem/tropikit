import { z } from "zod";

export const destinationSlugParamSchema = z.object({
  slug: z.string().min(1).max(100),
});

export const destinationListQuerySchema = z.object({
  search: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  malariaRisk: z.enum(["high", "moderate", "low", "none"]).optional(),
});

export const malariaCalculateSchema = z.object({
  drug: z.enum(["atovaquone-proguanil", "doxycycline", "mefloquine", "chloroquine"]),
  tripStart: z.coerce.date(),
  tripEnd: z.coerce.date(),
});

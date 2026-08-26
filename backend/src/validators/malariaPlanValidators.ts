import { z } from "zod";
import { isValidTimezone } from "../utils/timezone";

export const saveMalariaPlanSchema = z.object({
  medication: z.enum(["atovaquone-proguanil", "doxycycline", "mefloquine", "chloroquine"]),
  timezone: z.string().min(1).max(100).refine(isValidTimezone, {
    message: "Unrecognized IANA timezone",
  }),
});

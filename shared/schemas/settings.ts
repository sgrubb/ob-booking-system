import { z } from "zod";

export const appSettingsSchema = z.object({
  id: z.number(),
  generatorFee: z.number(),
  defaultTeamSize: z.number(),
});

export const updateAppSettingsSchema = z.object({
  generatorFee: z.number().min(0).optional(),
  defaultTeamSize: z.number().int().min(1).optional(),
  updatedAt: z.coerce.date(),
});

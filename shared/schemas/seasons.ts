import { z } from "zod";

export const bankHolidaySchema = z.object({
  id: z.number(),
  seasonId: z.number(),
  label: z.string(),
  date: z.coerce.date(),
});

export const seasonSchema = z.object({
  id: z.number(),
  name: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean(),
  bankHolidays: z.array(bankHolidaySchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createSeasonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  bankHolidays: z.array(z.object({
    label: z.string().min(1),
    date: z.coerce.date(),
  })),
}).refine(d => d.endDate > d.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const updateSeasonSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  updatedAt: z.coerce.date(),
});

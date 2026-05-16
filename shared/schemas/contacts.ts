import { z } from "zod";

export const contactSchema = z.object({
  id: z.number(),
  name: z.string(),
  tel: z.string().nullable(),
  mobile: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tel: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  email: z.string().email("Invalid email").nullable().optional(),
  address: z.string().nullable().optional(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  tel: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  updatedAt: z.coerce.date(),
});

export const contactListParamsSchema = z.object({
  search: z.string().optional(),
});

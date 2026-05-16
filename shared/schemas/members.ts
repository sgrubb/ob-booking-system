import { z } from "zod";

export const memberSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  isTeamLeader: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").nullable().optional(),
  phone: z.string().nullable().optional(),
  isTeamLeader: z.boolean(),
});

export const updateMemberSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  isTeamLeader: z.boolean().optional(),
  isActive: z.boolean().optional(),
  updatedAt: z.coerce.date(),
});

export const memberListParamsSchema = z.object({
  includeInactive: z.boolean().optional(),
});

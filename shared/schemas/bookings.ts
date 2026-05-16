import { z } from "zod";
import { ragStatusSchema, bookingStatusSchema, obUnitSchema, cancelReasonSchema } from "./enums";

const memberRefSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
});

const bookingHelperSchema = z.object({
  id: z.number(),
  memberId: z.number(),
  member: memberRefSchema,
});

const contactSchema = z.object({
  id: z.number(),
  name: z.string(),
  tel: z.string().nullable(),
  mobile: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const bookingSchema = z.object({
  id: z.number(),
  bookingRef: z.string(),
  seasonId: z.number(),
  date: z.coerce.date(),
  setupTime: z.string(),
  eventTimeStart: z.string(),
  eventTimeEnd: z.string(),
  eventName: z.string(),
  venue: z.string().nullable(),
  location: z.string().nullable(),
  ragStatus: ragStatusSchema,
  bookingStatus: bookingStatusSchema.nullable(),
  obUnit: obUnitSchema,
  doubleBooking: z.boolean(),
  generatorRequired: z.boolean(),
  requiredTeamSize: z.number(),
  teamLeaderId: z.number().nullable(),
  contactId: z.number().nullable(),
  fee: z.number(),
  generatorFee: z.number(),
  total: z.number(),
  deposit: z.number(),
  balance: z.number(),
  invoiceAddress: z.string().nullable(),
  comments: z.string().nullable(),
  cancelledAt: z.coerce.date().nullable(),
  cancelReason: cancelReasonSchema.nullable(),
  cancelNote: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const bookingWithRelationsSchema = bookingSchema.extend({
  season: z.object({ id: z.number(), name: z.string() }),
  teamLeader: memberRefSchema.nullable(),
  helpers: z.array(bookingHelperSchema),
  contact: contactSchema.nullable(),
});

export const createBookingSchema = z.object({
  bookingRef: z.string().min(1, "Booking ref is required"),
  seasonId: z.number().int().positive(),
  date: z.coerce.date(),
  setupTime: z.string().min(1, "Setup time is required"),
  eventTimeStart: z.string().min(1, "Event start time is required"),
  eventTimeEnd: z.string().min(1, "Event end time is required"),
  eventName: z.string().min(1, "Event name is required"),
  venue: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  ragStatus: ragStatusSchema,
  bookingStatus: bookingStatusSchema.nullable().optional(),
  obUnit: obUnitSchema,
  doubleBooking: z.boolean(),
  generatorRequired: z.boolean(),
  requiredTeamSize: z.number().int().min(1),
  teamLeaderId: z.number().int().positive().nullable().optional(),
  helperIds: z.array(z.number().int().positive()),
  contactId: z.number().int().positive().nullable().optional(),
  fee: z.number().min(0),
  generatorFee: z.number().min(0),
  total: z.number().min(0),
  deposit: z.number().min(0),
  balance: z.number(),
  invoiceAddress: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
});

export const updateBookingSchema = createBookingSchema
  .omit({ bookingRef: true, seasonId: true })
  .partial()
  .extend({ updatedAt: z.coerce.date() });

export const cancelBookingSchema = z.object({
  cancelReason: cancelReasonSchema,
  cancelNote: z.string().nullable().optional(),
  updatedAt: z.coerce.date(),
});

export const bookingListParamsSchema = z.object({
  seasonId: z.number().int().positive().optional(),
  filters: z.object({
    ragStatus: ragStatusSchema.optional(),
    bookingStatus: bookingStatusSchema.optional(),
    teamLeaderId: z.number().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    cancelled: z.boolean().optional(),
  }).optional(),
});

export const seasonStatsSchema = z.object({
  totalBookings: z.number(),
  cancelledBookings: z.number(),
  totalRevenue: z.number(),
  totalGeneratorFees: z.number(),
  totalCollected: z.number(),
  outstandingBalance: z.number(),
  bookingsPerMonth: z.array(z.object({ month: z.number(), count: z.number() })),
  memberStats: z.array(z.object({
    memberId: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    asLeader: z.number(),
    asHelper: z.number(),
    total: z.number(),
  })),
});

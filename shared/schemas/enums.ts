import { z } from "zod";
import { RagStatus, BookingStatus, ObUnit, CancelReason } from "../types/enums";

export const ragStatusSchema = z.enum(Object.values(RagStatus) as [RagStatus, ...RagStatus[]]);
export const bookingStatusSchema = z.enum(Object.values(BookingStatus) as [BookingStatus, ...BookingStatus[]]);
export const obUnitSchema = z.enum(Object.values(ObUnit) as [ObUnit, ...ObUnit[]]);
export const cancelReasonSchema = z.enum(Object.values(CancelReason) as [CancelReason, ...CancelReason[]]);

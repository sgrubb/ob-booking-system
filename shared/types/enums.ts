export const RagStatus = {
  GREEN: "GREEN",
  RED: "RED",
} as const;
export type RagStatus = (typeof RagStatus)[keyof typeof RagStatus];

export const BookingStatus = {
  DEPOSIT_RECEIVED: "DEPOSIT_RECEIVED",
  FULL_AMOUNT_PAID: "FULL_AMOUNT_PAID",
  EVENT_CANCELLED: "EVENT_CANCELLED",
  NO_PAYMENT_REQUIRED: "NO_PAYMENT_REQUIRED",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const ObUnit = {
  OB_WAGON: "OB_WAGON",
  SECOND_UNIT: "SECOND_UNIT",
} as const;
export type ObUnit = (typeof ObUnit)[keyof typeof ObUnit];

export const CancelReason = {
  DOUBLE_ENTRY: "DOUBLE_ENTRY",
  EVENT_CANCELLED: "EVENT_CANCELLED",
} as const;
export type CancelReason = (typeof CancelReason)[keyof typeof CancelReason];

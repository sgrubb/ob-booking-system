import { RagStatus, BookingStatus, ObUnit, CancelReason } from "@shared/types/enums";

export const RAG_STATUS_LABELS: Record<string, string> = {
  [RagStatus.GREEN]: "Green",
  [RagStatus.RED]: "Red",
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  [BookingStatus.DEPOSIT_RECEIVED]: "Deposit Received",
  [BookingStatus.FULL_AMOUNT_PAID]: "Full Amount Paid",
  [BookingStatus.EVENT_CANCELLED]: "Event Cancelled",
  [BookingStatus.NO_PAYMENT_REQUIRED]: "No Payment Required",
};

export const OB_UNIT_LABELS: Record<string, string> = {
  [ObUnit.OB_WAGON]: "OB Wagon",
  [ObUnit.SECOND_UNIT]: "Second Unit",
};

export const CANCEL_REASON_LABELS: Record<string, string> = {
  [CancelReason.DOUBLE_ENTRY]: "Double Entry",
  [CancelReason.EVENT_CANCELLED]: "Event Cancelled",
};

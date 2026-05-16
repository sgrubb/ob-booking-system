import type { RagStatus, BookingStatus, ObUnit, CancelReason } from "./enums";
import type { Member } from "./members";
import type { Contact } from "./contacts";
import type { Season } from "./seasons";

export interface BookingHelper {
  id: number;
  memberId: number;
  member: Pick<Member, "id" | "firstName" | "lastName">;
}

export interface Booking {
  id: number;
  bookingRef: string;
  seasonId: number;
  date: Date;
  setupTime: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  eventName: string;
  venue: string | null;
  location: string | null;
  ragStatus: RagStatus;
  bookingStatus: BookingStatus | null;
  obUnit: ObUnit;
  doubleBooking: boolean;
  generatorRequired: boolean;
  requiredTeamSize: number;
  teamLeaderId: number | null;
  contactId: number | null;
  fee: number;
  generatorFee: number;
  total: number;
  deposit: number;
  balance: number;
  invoiceAddress: string | null;
  comments: string | null;
  cancelledAt: Date | null;
  cancelReason: CancelReason | null;
  cancelNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingWithRelations extends Booking {
  season: Pick<Season, "id" | "name">;
  teamLeader: Pick<Member, "id" | "firstName" | "lastName"> | null;
  helpers: BookingHelper[];
  contact: Contact | null;
}

export interface BookingFilters {
  ragStatus?: RagStatus;
  bookingStatus?: BookingStatus;
  teamLeaderId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  cancelled?: boolean;
}

export interface BookingListParams {
  seasonId?: number;
  filters?: BookingFilters;
}

export interface CreateBooking {
  bookingRef: string;
  seasonId: number;
  date: Date;
  setupTime: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  eventName: string;
  venue?: string | null;
  location?: string | null;
  ragStatus: RagStatus;
  bookingStatus?: BookingStatus | null;
  obUnit: ObUnit;
  doubleBooking: boolean;
  generatorRequired: boolean;
  requiredTeamSize: number;
  teamLeaderId?: number | null;
  helperIds: number[];
  contactId?: number | null;
  fee: number;
  generatorFee: number;
  total: number;
  deposit: number;
  balance: number;
  invoiceAddress?: string | null;
  comments?: string | null;
}

export interface UpdateBooking extends Partial<Omit<CreateBooking, "bookingRef" | "seasonId">> {
  updatedAt: Date;
}

export interface CancelBooking {
  cancelReason: CancelReason;
  cancelNote?: string | null;
  updatedAt: Date;
}

export interface SeasonStats {
  totalBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalGeneratorFees: number;
  totalCollected: number;
  outstandingBalance: number;
  bookingsPerMonth: { month: number; count: number }[];
  memberStats: {
    memberId: number;
    firstName: string;
    lastName: string;
    asLeader: number;
    asHelper: number;
    total: number;
  }[];
}

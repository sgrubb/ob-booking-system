import type { BookingListParams } from "@shared/types/bookings";
import type { MemberListParams } from "@shared/types/members";
import type { ContactListParams } from "@shared/types/contacts";

export const queryKeys = {
  seasons: {
    root: ["seasons"] as const,
    list: () => ["seasons", "list"] as const,
    detail: (id: number) => ["seasons", id] as const,
    active: () => ["seasons", "active"] as const,
  },
  members: {
    root: ["members"] as const,
    list: (params: MemberListParams) => ["members", "list", params] as const,
    detail: (id: number) => ["members", id] as const,
  },
  contacts: {
    root: ["contacts"] as const,
    list: (params: ContactListParams) => ["contacts", "list", params] as const,
    detail: (id: number) => ["contacts", id] as const,
  },
  bookings: {
    root: ["bookings"] as const,
    list: (params: BookingListParams) => ["bookings", "list", params] as const,
    detail: (id: number) => ["bookings", id] as const,
  },
  stats: {
    season: (seasonId: number) => ["stats", "season", seasonId] as const,
  },
  settings: {
    dbPath: ["settings", "dbPath"] as const,
    app: ["settings", "app"] as const,
  },
};

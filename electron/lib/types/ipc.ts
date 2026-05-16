import type { IpcResponse } from "@shared/types/ipc";
import type { MigrationInfo } from "@shared/types/migrations";
import type {
  Season,
  CreateSeason,
  UpdateSeason,
  BankHoliday,
} from "@shared/types/seasons";
import type { Member, CreateMember, UpdateMember, MemberListParams } from "@shared/types/members";
import type { Contact, CreateContact, UpdateContact, ContactListParams } from "@shared/types/contacts";
import type {
  Booking,
  BookingWithRelations,
  BookingListParams,
  CreateBooking,
  UpdateBooking,
  CancelBooking,
  SeasonStats,
} from "@shared/types/bookings";
import type { AppSettings, UpdateAppSettings } from "@shared/types/settings";

export type { IpcErrorCode, IpcError, IpcResponse } from "@shared/types/ipc";

export type IpcApi = {
  // App
  "app:version": { args: void; result: string };

  // Setup wizard
  "setup:open-save-dialog": { args: void; result: IpcResponse<string | null> };
  "setup:open-file-dialog": { args: void; result: IpcResponse<string | null> };
  "setup:create-database": { args: string; result: IpcResponse<null> };
  "setup:validate-existing-database": { args: string; result: IpcResponse<null> };
  "setup:save-config": { args: string; result: IpcResponse<null> };
  "setup:complete": { args: void; result: IpcResponse<null> };

  // Migration
  "migration:get-info": { args: void; result: IpcResponse<MigrationInfo> };
  "migration:apply": { args: void; result: IpcResponse<null> };
  "migration:complete": { args: void; result: IpcResponse<null> };
  "migration:quit": { args: void; result: void };

  // App settings (DB path, dialog)
  "settings:get-db-path": { args: void; result: IpcResponse<string | null> };
  "settings:set-db-path": { args: string; result: IpcResponse<null> };
  "settings:open-file-dialog": { args: void; result: IpcResponse<string | null> };

  // App config (generator fee, default team size)
  "app-settings:get": { args: void; result: IpcResponse<AppSettings> };
  "app-settings:update": { args: UpdateAppSettings; result: IpcResponse<AppSettings> };

  // Seasons
  "season:list": { args: void; result: IpcResponse<Season[]> };
  "season:get": { args: number; result: IpcResponse<Season> };
  "season:get-active": { args: void; result: IpcResponse<Season | null> };
  "season:create": { args: CreateSeason; result: IpcResponse<Season> };
  "season:update": { args: { id: number; data: UpdateSeason }; result: IpcResponse<Season> };
  "season:set-active": { args: number; result: IpcResponse<Season> };
  "season:add-bank-holiday": { args: { seasonId: number; label: string; date: Date }; result: IpcResponse<BankHoliday> };
  "season:remove-bank-holiday": { args: number; result: IpcResponse<null> };

  // Members
  "member:list": { args: MemberListParams; result: IpcResponse<Member[]> };
  "member:get": { args: number; result: IpcResponse<Member> };
  "member:create": { args: CreateMember; result: IpcResponse<Member> };
  "member:update": { args: { id: number; data: UpdateMember }; result: IpcResponse<Member> };

  // Contacts
  "contact:list": { args: ContactListParams; result: IpcResponse<Contact[]> };
  "contact:get": { args: number; result: IpcResponse<Contact> };
  "contact:create": { args: CreateContact; result: IpcResponse<Contact> };
  "contact:update": { args: { id: number; data: UpdateContact }; result: IpcResponse<Contact> };

  // Bookings
  "booking:list": { args: BookingListParams; result: IpcResponse<BookingWithRelations[]> };
  "booking:get": { args: number; result: IpcResponse<BookingWithRelations> };
  "booking:create": { args: CreateBooking; result: IpcResponse<Booking> };
  "booking:update": { args: { id: number; data: UpdateBooking }; result: IpcResponse<Booking> };
  "booking:cancel": { args: { id: number; data: CancelBooking }; result: IpcResponse<Booking> };
  "booking:clone": { args: number; result: IpcResponse<Booking> };
  "booking:next-ref": { args: { seasonId: number; date: string }; result: IpcResponse<string> };

  // Statistics
  "stats:season": { args: number; result: IpcResponse<SeasonStats> };

  // Export (PDF)
  "export:booking-form": { args: number; result: IpcResponse<{ path: string } | null> };
  "export:invoice": { args: number; result: IpcResponse<{ path: string } | null> };
};

export type IpcChannel = keyof IpcApi;

import { z } from "zod";
import {
  seasonSchema,
  bankHolidaySchema,
} from "@shared/schemas/seasons";
import { memberSchema } from "@shared/schemas/members";
import { contactSchema } from "@shared/schemas/contacts";
import {
  bookingSchema,
  bookingWithRelationsSchema,
  seasonStatsSchema,
} from "@shared/schemas/bookings";
import { appSettingsSchema } from "@shared/schemas/settings";
import { migrationInfoSchema } from "@shared/schemas/migrations";
import { IpcErrorCode } from "@shared/types/ipc";
import type { Season, CreateSeason, UpdateSeason } from "@shared/types/seasons";
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
import type { MigrationInfo } from "@shared/types/migrations";

const ERROR_MESSAGES: Record<string, string> = {
  [IpcErrorCode.UniqueConstraint]: "A record with this value already exists.",
  [IpcErrorCode.NotFound]: "The requested record was not found.",
  [IpcErrorCode.ForeignKey]: "A related record could not be found.",
  [IpcErrorCode.Validation]: "The provided data is invalid.",
  [IpcErrorCode.Conflict]: "This record was modified by someone else.",
  [IpcErrorCode.Unknown]: "An unexpected error occurred.",
};

export class IpcError extends Error {
  constructor(
    public readonly code: IpcErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "IpcError";
  }
}

function unwrapResponse(response: unknown): unknown {
  if (typeof response !== "object" || response === null) {
    throw new Error("Unexpected response from IPC handler.");
  }

  const r = response as {
    success: boolean;
    data?: unknown;
    error?: { code: IpcErrorCode; message: string };
  };

  if (!r.success) {
    const code = r.error?.code ?? IpcErrorCode.Unknown;
    const message = ERROR_MESSAGES[code] ?? r.error?.message ?? "An unexpected error occurred.";
    throw new IpcError(code, message);
  }

  return r.data;
}

export const ipc = {
  // ── App ────────────────────────────────────────────────────────────────
  async getVersion(): Promise<string> {
    const result = await window.electronAPI.invoke("app:version");
    return z.string().parse(result);
  },

  // ── Setup wizard ───────────────────────────────────────────────────────
  async setupOpenSaveDialog(): Promise<string | null> {
    const response = await window.electronAPI.invoke("setup:open-save-dialog");
    return z.string().nullable().parse(unwrapResponse(response));
  },

  async setupOpenFileDialog(): Promise<string | null> {
    const response = await window.electronAPI.invoke("setup:open-file-dialog");
    return z.string().nullable().parse(unwrapResponse(response));
  },

  async setupCreateDatabase(filePath: string): Promise<void> {
    const response = await window.electronAPI.invoke("setup:create-database", filePath);
    unwrapResponse(response);
  },

  async setupValidateExistingDatabase(filePath: string): Promise<void> {
    const response = await window.electronAPI.invoke("setup:validate-existing-database", filePath);
    unwrapResponse(response);
  },

  async setupSaveConfig(dbPath: string): Promise<void> {
    const response = await window.electronAPI.invoke("setup:save-config", dbPath);
    unwrapResponse(response);
  },

  async setupComplete(): Promise<void> {
    const response = await window.electronAPI.invoke("setup:complete");
    unwrapResponse(response);
  },

  // ── Migration ──────────────────────────────────────────────────────────
  async migrationGetInfo(): Promise<MigrationInfo> {
    const response = await window.electronAPI.invoke("migration:get-info");
    return migrationInfoSchema.parse(unwrapResponse(response));
  },

  async migrationApply(): Promise<void> {
    const response = await window.electronAPI.invoke("migration:apply");
    unwrapResponse(response);
  },

  async migrationComplete(): Promise<void> {
    const response = await window.electronAPI.invoke("migration:complete");
    unwrapResponse(response);
  },

  async migrationQuit(): Promise<void> {
    await window.electronAPI.invoke("migration:quit");
  },

  // ── App settings ───────────────────────────────────────────────────────
  async getDbPath(): Promise<string | null> {
    const response = await window.electronAPI.invoke("settings:get-db-path");
    return z.string().nullable().parse(unwrapResponse(response));
  },

  async setDbPath(newPath: string): Promise<void> {
    const response = await window.electronAPI.invoke("settings:set-db-path", newPath);
    unwrapResponse(response);
  },

  async openFileDialog(): Promise<string | null> {
    const response = await window.electronAPI.invoke("settings:open-file-dialog");
    return z.string().nullable().parse(unwrapResponse(response));
  },

  async getAppSettings(): Promise<AppSettings> {
    const response = await window.electronAPI.invoke("app-settings:get");
    return appSettingsSchema.parse(unwrapResponse(response));
  },

  async updateAppSettings(data: UpdateAppSettings): Promise<AppSettings> {
    const response = await window.electronAPI.invoke("app-settings:update", data);
    return appSettingsSchema.parse(unwrapResponse(response));
  },

  // ── Seasons ────────────────────────────────────────────────────────────
  async listSeasons(): Promise<Season[]> {
    const response = await window.electronAPI.invoke("season:list");
    return z.array(seasonSchema).parse(unwrapResponse(response));
  },

  async getSeason(id: number): Promise<Season> {
    const response = await window.electronAPI.invoke("season:get", id);
    return seasonSchema.parse(unwrapResponse(response));
  },

  async getActiveSeason(): Promise<Season | null> {
    const response = await window.electronAPI.invoke("season:get-active");
    return seasonSchema.nullable().parse(unwrapResponse(response));
  },

  async createSeason(data: CreateSeason): Promise<Season> {
    const response = await window.electronAPI.invoke("season:create", data);
    return seasonSchema.parse(unwrapResponse(response));
  },

  async updateSeason(id: number, data: UpdateSeason): Promise<Season> {
    const response = await window.electronAPI.invoke("season:update", { id, data });
    return seasonSchema.parse(unwrapResponse(response));
  },

  async setActiveSeason(id: number): Promise<Season> {
    const response = await window.electronAPI.invoke("season:set-active", id);
    return seasonSchema.parse(unwrapResponse(response));
  },

  async addBankHoliday(seasonId: number, label: string, date: Date): Promise<void> {
    const response = await window.electronAPI.invoke("season:add-bank-holiday", {
      seasonId,
      label,
      date,
    });
    bankHolidaySchema.parse(unwrapResponse(response));
  },

  async removeBankHoliday(id: number): Promise<void> {
    const response = await window.electronAPI.invoke("season:remove-bank-holiday", id);
    unwrapResponse(response);
  },

  // ── Members ────────────────────────────────────────────────────────────
  async listMembers(params: MemberListParams = {}): Promise<Member[]> {
    const response = await window.electronAPI.invoke("member:list", params);
    return z.array(memberSchema).parse(unwrapResponse(response));
  },

  async getMember(id: number): Promise<Member> {
    const response = await window.electronAPI.invoke("member:get", id);
    return memberSchema.parse(unwrapResponse(response));
  },

  async createMember(data: CreateMember): Promise<Member> {
    const response = await window.electronAPI.invoke("member:create", data);
    return memberSchema.parse(unwrapResponse(response));
  },

  async updateMember(id: number, data: UpdateMember): Promise<Member> {
    const response = await window.electronAPI.invoke("member:update", { id, data });
    return memberSchema.parse(unwrapResponse(response));
  },

  // ── Contacts ───────────────────────────────────────────────────────────
  async listContacts(params: ContactListParams = {}): Promise<Contact[]> {
    const response = await window.electronAPI.invoke("contact:list", params);
    return z.array(contactSchema).parse(unwrapResponse(response));
  },

  async getContact(id: number): Promise<Contact> {
    const response = await window.electronAPI.invoke("contact:get", id);
    return contactSchema.parse(unwrapResponse(response));
  },

  async createContact(data: CreateContact): Promise<Contact> {
    const response = await window.electronAPI.invoke("contact:create", data);
    return contactSchema.parse(unwrapResponse(response));
  },

  async updateContact(id: number, data: UpdateContact): Promise<Contact> {
    const response = await window.electronAPI.invoke("contact:update", { id, data });
    return contactSchema.parse(unwrapResponse(response));
  },

  // ── Bookings ───────────────────────────────────────────────────────────
  async listBookings(params: BookingListParams = {}): Promise<BookingWithRelations[]> {
    const response = await window.electronAPI.invoke("booking:list", params);
    return z.array(bookingWithRelationsSchema).parse(unwrapResponse(response));
  },

  async getBooking(id: number): Promise<BookingWithRelations> {
    const response = await window.electronAPI.invoke("booking:get", id);
    return bookingWithRelationsSchema.parse(unwrapResponse(response));
  },

  async createBooking(data: CreateBooking): Promise<Booking> {
    const response = await window.electronAPI.invoke("booking:create", data);
    return bookingSchema.parse(unwrapResponse(response));
  },

  async updateBooking(id: number, data: UpdateBooking): Promise<Booking> {
    const response = await window.electronAPI.invoke("booking:update", { id, data });
    return bookingSchema.parse(unwrapResponse(response));
  },

  async cancelBooking(id: number, data: CancelBooking): Promise<Booking> {
    const response = await window.electronAPI.invoke("booking:cancel", { id, data });
    return bookingSchema.parse(unwrapResponse(response));
  },

  async cloneBooking(id: number): Promise<Booking> {
    const response = await window.electronAPI.invoke("booking:clone", id);
    return bookingSchema.parse(unwrapResponse(response));
  },

  async getNextBookingRef(seasonId: number, date: string): Promise<string> {
    const response = await window.electronAPI.invoke("booking:next-ref", { seasonId, date });
    return z.string().parse(unwrapResponse(response));
  },

  // ── Statistics ─────────────────────────────────────────────────────────
  async getSeasonStats(seasonId: number): Promise<SeasonStats> {
    const response = await window.electronAPI.invoke("stats:season", seasonId);
    return seasonStatsSchema.parse(unwrapResponse(response));
  },

  // ── Export ─────────────────────────────────────────────────────────────
  async exportBookingForm(id: number): Promise<{ path: string } | null> {
    const response = await window.electronAPI.invoke("export:booking-form", id);
    return z.object({ path: z.string() }).nullable().parse(unwrapResponse(response));
  },

  async exportInvoice(id: number): Promise<{ path: string } | null> {
    const response = await window.electronAPI.invoke("export:invoice", id);
    return z.object({ path: z.string() }).nullable().parse(unwrapResponse(response));
  },
};

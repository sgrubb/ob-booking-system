import type { IpcMain } from "electron";
import type { PrismaClient } from "../../generated/prisma/client";
import { handleIpc } from "../lib/error-handler";
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  bookingListParamsSchema,
} from "@shared/schemas/bookings";
import { IpcErrorCode } from "@shared/types/ipc";
import type { IpcApi } from "../lib/types/ipc";

const bookingInclude = {
  season: { select: { id: true, name: true } },
  teamLeader: { select: { id: true, firstName: true, lastName: true } },
  helpers: {
    include: {
      member: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  contact: true,
};

function buildNextRef(date: Date, sequence: number): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const nn = String(sequence).padStart(2, "0");
  return `#${yy}${mm}-${nn}`;
}

async function getNextSequence(prisma: PrismaClient, seasonId: number): Promise<number> {
  const count = await prisma.booking.count({ where: { seasonId } });
  return count + 1;
}

export function registerBookingHandlers(ipcMain: IpcMain, prisma: PrismaClient): void {
  ipcMain.handle(
    "booking:list",
    (_e, rawData: unknown): Promise<IpcApi["booking:list"]["result"]> =>
      handleIpc("booking:list", async () => {
        const params = bookingListParamsSchema.parse(rawData ?? {});
        const where: Record<string, unknown> = {};
        if (params.seasonId) {
          where["seasonId"] = params.seasonId;
        }
        if (params.filters) {
          const f = params.filters;
          if (f.ragStatus) where["ragStatus"] = f.ragStatus;
          if (f.bookingStatus) where["bookingStatus"] = f.bookingStatus;
          if (f.teamLeaderId) where["teamLeaderId"] = f.teamLeaderId;
          if (f.dateFrom || f.dateTo) {
            where["date"] = {
              ...(f.dateFrom ? { gte: f.dateFrom } : {}),
              ...(f.dateTo ? { lte: f.dateTo } : {}),
            };
          }
          if (f.cancelled !== undefined) {
            where["cancelledAt"] = f.cancelled ? { not: null } : null;
          }
        }
        return prisma.booking.findMany({
          where,
          include: bookingInclude,
          orderBy: { date: "asc" },
        });
      }),
  );

  ipcMain.handle(
    "booking:get",
    (_e, id: number): Promise<IpcApi["booking:get"]["result"]> =>
      handleIpc("booking:get", async () =>
        prisma.booking.findUniqueOrThrow({ where: { id }, include: bookingInclude }),
      ),
  );

  ipcMain.handle(
    "booking:create",
    (_e, rawData: unknown): Promise<IpcApi["booking:create"]["result"]> =>
      handleIpc("booking:create", async () => {
        const { helperIds, ...fields } = createBookingSchema.parse(rawData);
        return prisma.booking.create({
          data: {
            ...fields,
            helpers: {
              create: helperIds.map((memberId) => ({ memberId })),
            },
          },
        });
      }),
  );

  ipcMain.handle(
    "booking:update",
    (_e, rawData: unknown): Promise<IpcApi["booking:update"]["result"]> =>
      handleIpc("booking:update", async () => {
        const { id, data: rawUpdate } = rawData as { id: number; data: unknown };
        const { updatedAt, helperIds, ...fields } = updateBookingSchema.parse(rawUpdate);
        const existing = await prisma.booking.findUniqueOrThrow({ where: { id } });
        if (existing.updatedAt.getTime() !== new Date(updatedAt).getTime()) {
          throw new Error(IpcErrorCode.Conflict);
        }
        if (helperIds !== undefined) {
          await prisma.bookingHelper.deleteMany({ where: { bookingId: id } });
        }
        return prisma.booking.update({
          where: { id },
          data: {
            ...fields,
            ...(helperIds !== undefined
              ? { helpers: { create: helperIds.map((memberId) => ({ memberId })) } }
              : {}),
          },
        });
      }),
  );

  ipcMain.handle(
    "booking:cancel",
    (_e, rawData: unknown): Promise<IpcApi["booking:cancel"]["result"]> =>
      handleIpc("booking:cancel", async () => {
        const { id, data: rawCancel } = rawData as { id: number; data: unknown };
        const { updatedAt, cancelReason, cancelNote } = cancelBookingSchema.parse(rawCancel);
        const existing = await prisma.booking.findUniqueOrThrow({ where: { id } });
        if (existing.updatedAt.getTime() !== new Date(updatedAt).getTime()) {
          throw new Error(IpcErrorCode.Conflict);
        }
        return prisma.booking.update({
          where: { id },
          data: {
            cancelledAt: new Date(),
            cancelReason,
            cancelNote: cancelNote ?? null,
          },
        });
      }),
  );

  ipcMain.handle(
    "booking:clone",
    (_e, id: number): Promise<IpcApi["booking:clone"]["result"]> =>
      handleIpc("booking:clone", async () => {
        const original = await prisma.booking.findUniqueOrThrow({
          where: { id },
          include: { helpers: true },
        });
        const sequence = await getNextSequence(prisma, original.seasonId);
        const newRef = buildNextRef(original.date, sequence);
        return prisma.booking.create({
          data: {
            bookingRef: newRef,
            seasonId: original.seasonId,
            date: original.date,
            setupTime: original.setupTime,
            eventTimeStart: original.eventTimeStart,
            eventTimeEnd: original.eventTimeEnd,
            eventName: original.eventName,
            venue: original.venue,
            location: original.location,
            ragStatus: original.ragStatus,
            bookingStatus: null,
            obUnit: original.obUnit,
            doubleBooking: false,
            generatorRequired: original.generatorRequired,
            requiredTeamSize: original.requiredTeamSize,
            teamLeaderId: original.teamLeaderId,
            contactId: original.contactId,
            fee: original.fee,
            generatorFee: original.generatorFee,
            total: original.total,
            deposit: 0,
            balance: original.total,
            invoiceAddress: original.invoiceAddress,
            comments: null,
            helpers: {
              create: original.helpers.map((h) => ({ memberId: h.memberId })),
            },
          },
        });
      }),
  );

  ipcMain.handle(
    "booking:next-ref",
    (_e, rawData: unknown): Promise<IpcApi["booking:next-ref"]["result"]> =>
      handleIpc("booking:next-ref", async () => {
        const { seasonId, date } = rawData as { seasonId: number; date: string };
        const sequence = await getNextSequence(prisma, seasonId);
        return buildNextRef(new Date(date), sequence);
      }),
  );

  ipcMain.handle(
    "stats:season",
    (_e, seasonId: number): Promise<IpcApi["stats:season"]["result"]> =>
      handleIpc("stats:season", async () => {
        const bookings = await prisma.booking.findMany({
          where: { seasonId },
          include: {
            helpers: { include: { member: { select: { id: true, firstName: true, lastName: true } } } },
            teamLeader: { select: { id: true, firstName: true, lastName: true } },
          },
        });

        const active = bookings.filter((b) => b.cancelledAt === null);
        const cancelled = bookings.filter((b) => b.cancelledAt !== null);

        const totalRevenue = active.reduce((sum, b) => sum + b.fee + b.generatorFee, 0);
        const totalGeneratorFees = active.reduce((sum, b) => sum + b.generatorFee, 0);
        const totalCollected = active.reduce((sum, b) => sum + b.deposit, 0);
        const outstandingBalance = active.reduce((sum, b) => sum + b.balance, 0);

        const monthCounts = new Map<number, number>();
        for (const b of active) {
          const month = b.date.getMonth() + 1;
          monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
        }
        const bookingsPerMonth = Array.from(monthCounts.entries())
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month - b.month);

        const memberMap = new Map<
          number,
          { memberId: number; firstName: string; lastName: string; asLeader: number; asHelper: number }
        >();

        for (const b of active) {
          if (b.teamLeader) {
            const existing = memberMap.get(b.teamLeader.id) ?? {
              memberId: b.teamLeader.id,
              firstName: b.teamLeader.firstName,
              lastName: b.teamLeader.lastName,
              asLeader: 0,
              asHelper: 0,
            };
            existing.asLeader += 1;
            memberMap.set(b.teamLeader.id, existing);
          }
          for (const h of b.helpers) {
            const existing = memberMap.get(h.member.id) ?? {
              memberId: h.member.id,
              firstName: h.member.firstName,
              lastName: h.member.lastName,
              asLeader: 0,
              asHelper: 0,
            };
            existing.asHelper += 1;
            memberMap.set(h.member.id, existing);
          }
        }

        const memberStats = Array.from(memberMap.values())
          .map((m) => ({ ...m, total: m.asLeader + m.asHelper }))
          .sort((a, b) => b.total - a.total);

        return {
          totalBookings: active.length,
          cancelledBookings: cancelled.length,
          totalRevenue,
          totalGeneratorFees,
          totalCollected,
          outstandingBalance,
          bookingsPerMonth,
          memberStats,
        };
      }),
  );
}

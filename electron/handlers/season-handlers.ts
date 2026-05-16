import type { IpcMain } from "electron";
import type { PrismaClient } from "../../generated/prisma/client";
import { handleIpc } from "../lib/error-handler";
import { createSeasonSchema, updateSeasonSchema } from "@shared/schemas/seasons";
import type { IpcApi } from "../lib/types/ipc";

const seasonInclude = {
  bankHolidays: { orderBy: { date: "asc" as const } },
};

export function registerSeasonHandlers(ipcMain: IpcMain, prisma: PrismaClient): void {
  ipcMain.handle(
    "season:list",
    (): Promise<IpcApi["season:list"]["result"]> =>
      handleIpc("season:list", async () =>
        prisma.season.findMany({
          include: seasonInclude,
          orderBy: { startDate: "desc" },
        }),
      ),
  );

  ipcMain.handle(
    "season:get",
    (_e, id: number): Promise<IpcApi["season:get"]["result"]> =>
      handleIpc("season:get", async () => {
        const season = await prisma.season.findUniqueOrThrow({
          where: { id },
          include: seasonInclude,
        });
        return season;
      }),
  );

  ipcMain.handle(
    "season:get-active",
    (): Promise<IpcApi["season:get-active"]["result"]> =>
      handleIpc("season:get-active", async () =>
        prisma.season.findFirst({
          where: { isActive: true },
          include: seasonInclude,
        }),
      ),
  );

  ipcMain.handle(
    "season:create",
    (_e, rawData: unknown): Promise<IpcApi["season:create"]["result"]> =>
      handleIpc("season:create", async () => {
        const { bankHolidays, ...rest } = createSeasonSchema.parse(rawData);
        return prisma.season.create({
          data: {
            ...rest,
            bankHolidays: {
              create: bankHolidays,
            },
          },
          include: seasonInclude,
        });
      }),
  );

  ipcMain.handle(
    "season:update",
    (_e, rawData: unknown): Promise<IpcApi["season:update"]["result"]> =>
      handleIpc("season:update", async () => {
        const { id, data: rawUpdate } = rawData as { id: number; data: unknown };
        const data = updateSeasonSchema.parse(rawUpdate);
        return prisma.season.update({
          where: { id },
          data,
          include: seasonInclude,
        });
      }),
  );

  ipcMain.handle(
    "season:set-active",
    (_e, id: number): Promise<IpcApi["season:set-active"]["result"]> =>
      handleIpc("season:set-active", async () => {
        await prisma.season.updateMany({ data: { isActive: false } });
        return prisma.season.update({
          where: { id },
          data: { isActive: true },
          include: seasonInclude,
        });
      }),
  );

  ipcMain.handle(
    "season:add-bank-holiday",
    (_e, rawData: unknown): Promise<IpcApi["season:add-bank-holiday"]["result"]> =>
      handleIpc("season:add-bank-holiday", async () => {
        const { seasonId, label, date } = rawData as { seasonId: number; label: string; date: Date };
        return prisma.bankHoliday.create({ data: { seasonId, label, date } });
      }),
  );

  ipcMain.handle(
    "season:remove-bank-holiday",
    (_e, id: number): Promise<IpcApi["season:remove-bank-holiday"]["result"]> =>
      handleIpc("season:remove-bank-holiday", async () => {
        await prisma.bankHoliday.delete({ where: { id } });
        return null;
      }),
  );
}

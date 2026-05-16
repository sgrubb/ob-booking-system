import type { IpcMain, Dialog } from "electron";
import type { PrismaClient } from "../../generated/prisma/client";
import { getConfiguredDbPath, writeConfig } from "../lib/app-config";
import { handleIpc } from "../lib/error-handler";
import { updateAppSettingsSchema } from "@shared/schemas/settings";
import type { IpcApi } from "../lib/types/ipc";

export function registerSettingsHandlers(
  ipcMain: IpcMain,
  dialog: Dialog,
  prisma: PrismaClient,
): void {
  ipcMain.handle(
    "settings:get-db-path",
    (): Promise<IpcApi["settings:get-db-path"]["result"]> =>
      handleIpc("settings:get-db-path", async () => getConfiguredDbPath()),
  );

  ipcMain.handle(
    "settings:set-db-path",
    (_event, newPath: string): Promise<IpcApi["settings:set-db-path"]["result"]> =>
      handleIpc("settings:set-db-path", async () => {
        writeConfig({ databasePath: newPath, createdByApp: false });
        return null;
      }),
  );

  ipcMain.handle(
    "settings:open-file-dialog",
    (): Promise<IpcApi["settings:open-file-dialog"]["result"]> =>
      handleIpc("settings:open-file-dialog", async () => {
        const result = await dialog.showOpenDialog({
          title: "Select Database File",
          filters: [{ name: "SQLite Database", extensions: ["db", "sqlite", "sqlite3"] }],
          properties: ["openFile"],
        });
        return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0] ?? null;
      }),
  );

  ipcMain.handle(
    "app-settings:get",
    (): Promise<IpcApi["app-settings:get"]["result"]> =>
      handleIpc("app-settings:get", async () => {
        let settings = await prisma.appSettings.findFirst();
        if (!settings) {
          settings = await prisma.appSettings.create({ data: {} });
        }
        return settings;
      }),
  );

  ipcMain.handle(
    "app-settings:update",
    (_e, rawData: unknown): Promise<IpcApi["app-settings:update"]["result"]> =>
      handleIpc("app-settings:update", async () => {
        const data = updateAppSettingsSchema.parse(rawData);
        let settings = await prisma.appSettings.findFirst();
        if (!settings) {
          settings = await prisma.appSettings.create({ data: {} });
        }
        return prisma.appSettings.update({
          where: { id: settings.id },
          data: {
            ...(data.generatorFee !== undefined ? { generatorFee: data.generatorFee } : {}),
            ...(data.defaultTeamSize !== undefined ? { defaultTeamSize: data.defaultTeamSize } : {}),
          },
        });
      }),
  );
}

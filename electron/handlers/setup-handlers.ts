import type { IpcMain, Dialog, BrowserWindow } from "electron";
import { initializeDatabase, validateDatabase, CURRENT_SCHEMA_VERSION } from "../lib/migrations";
import { writeConfig } from "../lib/app-config";
import { handleIpc } from "../lib/error-handler";
import { IpcErrorCode } from "@shared/types/ipc";
import type { IpcApi } from "../lib/types/ipc";

export function registerSetupHandlers(
  ipcMain: IpcMain,
  dialog: Dialog,
  setupWin: BrowserWindow,
  onComplete: () => Promise<void>,
): void {
  ipcMain.handle(
    "setup:open-save-dialog",
    (): Promise<IpcApi["setup:open-save-dialog"]["result"]> =>
      handleIpc("setup:open-save-dialog", async () => {
        const result = await dialog.showSaveDialog(setupWin, {
          title: "Create New Database",
          defaultPath: "ob-bookings.db",
          filters: [{ name: "SQLite Database", extensions: ["db"] }],
        });
        return result.canceled || !result.filePath ? null : result.filePath;
      }),
  );

  ipcMain.handle(
    "setup:open-file-dialog",
    (): Promise<IpcApi["setup:open-file-dialog"]["result"]> =>
      handleIpc("setup:open-file-dialog", async () => {
        const result = await dialog.showOpenDialog(setupWin, {
          title: "Select Database File",
          filters: [{ name: "SQLite Database", extensions: ["db", "sqlite", "sqlite3"] }],
          properties: ["openFile"],
        });
        return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0] ?? null;
      }),
  );

  ipcMain.handle(
    "setup:create-database",
    (_e, filePath: string): Promise<IpcApi["setup:create-database"]["result"]> =>
      handleIpc("setup:create-database", async () => {
        initializeDatabase(filePath);
        return null;
      }),
  );

  ipcMain.handle(
    "setup:validate-existing-database",
    (_e, filePath: string): Promise<IpcApi["setup:validate-existing-database"]["result"]> =>
      handleIpc("setup:validate-existing-database", async () => {
        const result = validateDatabase(filePath);
        if (!result.valid) {
          throw new Error(IpcErrorCode.Validation);
        }
        if (result.version !== CURRENT_SCHEMA_VERSION) {
          throw new Error(IpcErrorCode.Validation);
        }
        return null;
      }),
  );

  ipcMain.handle(
    "setup:save-config",
    (_e, dbPath: string): Promise<IpcApi["setup:save-config"]["result"]> =>
      handleIpc("setup:save-config", async () => {
        writeConfig({ databasePath: dbPath, createdByApp: false });
        return null;
      }),
  );

  ipcMain.handle(
    "setup:complete",
    (): Promise<IpcApi["setup:complete"]["result"]> =>
      handleIpc("setup:complete", async () => {
        await onComplete();
        setupWin.close();
        return null;
      }),
  );
}

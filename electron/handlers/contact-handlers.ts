import type { IpcMain } from "electron";
import type { PrismaClient } from "../../generated/prisma/client";
import { handleIpc } from "../lib/error-handler";
import { createContactSchema, updateContactSchema } from "@shared/schemas/contacts";
import { IpcErrorCode } from "@shared/types/ipc";
import type { IpcApi } from "../lib/types/ipc";

export function registerContactHandlers(ipcMain: IpcMain, prisma: PrismaClient): void {
  ipcMain.handle(
    "contact:list",
    (_e, rawData: unknown): Promise<IpcApi["contact:list"]["result"]> =>
      handleIpc("contact:list", async () => {
        const params = rawData as { search?: string } | undefined;
        return prisma.contact.findMany({
          where: params?.search
            ? { name: { contains: params.search } }
            : undefined,
          orderBy: { name: "asc" },
        });
      }),
  );

  ipcMain.handle(
    "contact:get",
    (_e, id: number): Promise<IpcApi["contact:get"]["result"]> =>
      handleIpc("contact:get", async () =>
        prisma.contact.findUniqueOrThrow({ where: { id } }),
      ),
  );

  ipcMain.handle(
    "contact:create",
    (_e, rawData: unknown): Promise<IpcApi["contact:create"]["result"]> =>
      handleIpc("contact:create", async () => {
        const data = createContactSchema.parse(rawData);
        return prisma.contact.create({
          data: {
            name: data.name.trim(),
            tel: data.tel ?? null,
            mobile: data.mobile ?? null,
            email: data.email ?? null,
            address: data.address ?? null,
          },
        });
      }),
  );

  ipcMain.handle(
    "contact:update",
    (_e, rawData: unknown): Promise<IpcApi["contact:update"]["result"]> =>
      handleIpc("contact:update", async () => {
        const { id, data: rawUpdate } = rawData as { id: number; data: unknown };
        const { updatedAt, ...fields } = updateContactSchema.parse(rawUpdate);
        const existing = await prisma.contact.findUniqueOrThrow({ where: { id } });
        if (existing.updatedAt.getTime() !== new Date(updatedAt).getTime()) {
          throw new Error(IpcErrorCode.Conflict);
        }
        return prisma.contact.update({
          where: { id },
          data: {
            ...(fields.name !== undefined ? { name: fields.name.trim() } : {}),
            ...(fields.tel !== undefined ? { tel: fields.tel } : {}),
            ...(fields.mobile !== undefined ? { mobile: fields.mobile } : {}),
            ...(fields.email !== undefined ? { email: fields.email } : {}),
            ...(fields.address !== undefined ? { address: fields.address } : {}),
          },
        });
      }),
  );
}

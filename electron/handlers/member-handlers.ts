import type { IpcMain } from "electron";
import type { PrismaClient } from "../../generated/prisma/client";
import { handleIpc } from "../lib/error-handler";
import { createMemberSchema, updateMemberSchema } from "@shared/schemas/members";
import { IpcErrorCode } from "@shared/types/ipc";
import type { IpcApi } from "../lib/types/ipc";

export function registerMemberHandlers(ipcMain: IpcMain, prisma: PrismaClient): void {
  ipcMain.handle(
    "member:list",
    (_e, rawData: unknown): Promise<IpcApi["member:list"]["result"]> =>
      handleIpc("member:list", async () => {
        const params = rawData as { includeInactive?: boolean } | undefined;
        return prisma.member.findMany({
          where: params?.includeInactive ? undefined : { isActive: true },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        });
      }),
  );

  ipcMain.handle(
    "member:get",
    (_e, id: number): Promise<IpcApi["member:get"]["result"]> =>
      handleIpc("member:get", async () =>
        prisma.member.findUniqueOrThrow({ where: { id } }),
      ),
  );

  ipcMain.handle(
    "member:create",
    (_e, rawData: unknown): Promise<IpcApi["member:create"]["result"]> =>
      handleIpc("member:create", async () => {
        const data = createMemberSchema.parse(rawData);
        return prisma.member.create({
          data: {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email ?? null,
            phone: data.phone ?? null,
            isTeamLeader: data.isTeamLeader,
          },
        });
      }),
  );

  ipcMain.handle(
    "member:update",
    (_e, rawData: unknown): Promise<IpcApi["member:update"]["result"]> =>
      handleIpc("member:update", async () => {
        const { id, data: rawUpdate } = rawData as { id: number; data: unknown };
        const { updatedAt, ...fields } = updateMemberSchema.parse(rawUpdate);
        const existing = await prisma.member.findUniqueOrThrow({ where: { id } });
        if (existing.updatedAt.getTime() !== new Date(updatedAt).getTime()) {
          throw new Error(IpcErrorCode.Conflict);
        }
        return prisma.member.update({
          where: { id },
          data: {
            ...(fields.firstName !== undefined ? { firstName: fields.firstName.trim() } : {}),
            ...(fields.lastName !== undefined ? { lastName: fields.lastName.trim() } : {}),
            ...(fields.email !== undefined ? { email: fields.email } : {}),
            ...(fields.phone !== undefined ? { phone: fields.phone } : {}),
            ...(fields.isTeamLeader !== undefined ? { isTeamLeader: fields.isTeamLeader } : {}),
            ...(fields.isActive !== undefined ? { isActive: fields.isActive } : {}),
          },
        });
      }),
  );
}

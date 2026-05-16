import path from "node:path";
import type { IpcMain, Dialog } from "electron";
import type { PrismaClient } from "../../generated/prisma/client";
import { handleIpc } from "../lib/error-handler";
import log from "../lib/logger";
import type { IpcApi } from "../lib/types/ipc";

const bookingInclude = {
  season: { select: { id: true, name: true } },
  teamLeader: { select: { id: true, firstName: true, lastName: true } },
  helpers: {
    include: { member: { select: { id: true, firstName: true, lastName: true } } },
  },
  contact: true,
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatCurrency(n: number): string {
  return `£${n.toFixed(2)}`;
}

export function registerExportHandlers(
  ipcMain: IpcMain,
  dialog: Dialog,
  prisma: PrismaClient,
): void {
  ipcMain.handle(
    "export:booking-form",
    (_e, id: number): Promise<IpcApi["export:booking-form"]["result"]> =>
      handleIpc("export:booking-form", async () => {
        const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
        const booking = await prisma.booking.findUniqueOrThrow({
          where: { id },
          include: bookingInclude,
        });

        const result = await dialog.showSaveDialog({
          title: "Save Booking Form",
          defaultPath: `booking-form-${booking.bookingRef.replace("#", "")}.pdf`,
          filters: [{ name: "PDF", extensions: ["pdf"] }],
        });
        if (result.canceled || !result.filePath) {
          return null;
        }

        const doc = await PDFDocument.create();
        const page = doc.addPage([595, 842]);
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const bold = await doc.embedFont(StandardFonts.HelveticaBold);
        const { height } = page.getSize();

        let y = height - 50;
        const left = 50;
        const lineHeight = 18;

        const drawText = (text: string, x: number, yPos: number, size = 11, isBold = false) => {
          page.drawText(text, { x, y: yPos, size, font: isBold ? bold : font, color: rgb(0, 0, 0) });
        };

        drawText("RFP Outside Broadcast — Booking Form", left, y, 16, true);
        y -= lineHeight * 2;

        const row = (label: string, value: string) => {
          drawText(`${label}:`, left, y, 11, true);
          drawText(value, 200, y, 11);
          y -= lineHeight;
        };

        row("Booking Ref", booking.bookingRef);
        row("Season", booking.season.name);
        row("Date", formatDate(booking.date));
        row("Setup Time", booking.setupTime);
        row("Event Start", booking.eventTimeStart);
        row("Event End", booking.eventTimeEnd);
        row("Event Name", booking.eventName);
        if (booking.venue) row("Venue", booking.venue);
        if (booking.location) row("Location", booking.location);
        row("OB Unit", booking.obUnit === "OB_WAGON" ? "OB Wagon" : "Second Unit");
        row("Team Leader", booking.teamLeader
          ? `${booking.teamLeader.firstName} ${booking.teamLeader.lastName}`
          : "TBC");
        const helperNames = booking.helpers.map((h) => `${h.member.firstName} ${h.member.lastName}`).join(", ");
        row("Helpers", helperNames || "None assigned");
        row("Required Team Size", String(booking.requiredTeamSize));
        row("Generator Required", booking.generatorRequired ? "Yes" : "No");

        y -= lineHeight;
        drawText("Fees", left, y, 13, true);
        y -= lineHeight;
        row("Event Fee", formatCurrency(booking.fee));
        if (booking.generatorRequired) row("Generator Fee", formatCurrency(booking.generatorFee));
        row("Total", formatCurrency(booking.total));
        row("Deposit", formatCurrency(booking.deposit));
        row("Balance", formatCurrency(booking.balance));

        if (booking.contact) {
          y -= lineHeight;
          drawText("Contact", left, y, 13, true);
          y -= lineHeight;
          row("Name", booking.contact.name);
          if (booking.contact.tel) row("Tel", booking.contact.tel);
          if (booking.contact.mobile) row("Mobile", booking.contact.mobile);
          if (booking.contact.email) row("Email", booking.contact.email);
        }

        if (booking.comments) {
          y -= lineHeight;
          drawText("Comments", left, y, 13, true);
          y -= lineHeight;
          drawText(booking.comments, left, y, 10);
        }

        const pdfBytes = await doc.save();
        const fs = await import("node:fs/promises");
        await fs.writeFile(result.filePath, pdfBytes);
        log.info(`Booking form PDF saved to ${result.filePath}`);
        return { path: result.filePath };
      }),
  );

  ipcMain.handle(
    "export:invoice",
    (_e, id: number): Promise<IpcApi["export:invoice"]["result"]> =>
      handleIpc("export:invoice", async () => {
        const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
        const booking = await prisma.booking.findUniqueOrThrow({
          where: { id },
          include: bookingInclude,
        });

        const result = await dialog.showSaveDialog({
          title: "Save Invoice",
          defaultPath: `invoice-${booking.bookingRef.replace("#", "")}.pdf`,
          filters: [{ name: "PDF", extensions: ["pdf"] }],
        });
        if (result.canceled || !result.filePath) {
          return null;
        }

        const doc = await PDFDocument.create();
        const page = doc.addPage([595, 842]);
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const bold = await doc.embedFont(StandardFonts.HelveticaBold);
        const { height } = page.getSize();

        let y = height - 50;
        const left = 50;
        const lineHeight = 18;

        const drawText = (text: string, x: number, yPos: number, size = 11, isBold = false) => {
          page.drawText(text, { x, y: yPos, size, font: isBold ? bold : font, color: rgb(0, 0, 0) });
        };

        drawText("Radio Frimley Park — Outside Broadcast Invoice", left, y, 16, true);
        y -= lineHeight * 2;

        const row = (label: string, value: string) => {
          drawText(`${label}:`, left, y, 11, true);
          drawText(value, 220, y, 11);
          y -= lineHeight;
        };

        row("Invoice For", booking.contact?.name ?? booking.eventName);
        if (booking.invoiceAddress) {
          drawText("Address:", left, y, 11, true);
          const lines = booking.invoiceAddress.split("\n");
          for (const line of lines) {
            drawText(line, 220, y, 11);
            y -= lineHeight;
          }
        }
        row("Booking Ref", booking.bookingRef);
        row("Event", booking.eventName);
        row("Date", formatDate(booking.date));
        if (booking.venue) row("Venue", booking.venue);

        y -= lineHeight;
        drawText("Charges", left, y, 13, true);
        y -= lineHeight;

        page.drawLine({ start: { x: left, y }, end: { x: 545, y }, thickness: 0.5, color: rgb(0, 0, 0) });
        y -= lineHeight;

        const itemRow = (desc: string, amount: number) => {
          drawText(desc, left, y, 11);
          drawText(formatCurrency(amount), 480, y, 11);
          y -= lineHeight;
        };

        itemRow("Outside Broadcast Service", booking.fee);
        if (booking.generatorRequired && booking.generatorFee > 0) {
          itemRow("Generator Hire", booking.generatorFee);
        }

        page.drawLine({ start: { x: left, y }, end: { x: 545, y }, thickness: 0.5, color: rgb(0, 0, 0) });
        y -= lineHeight;

        drawText("Total:", 380, y, 12, true);
        drawText(formatCurrency(booking.total), 480, y, 12, true);
        y -= lineHeight;

        if (booking.deposit > 0) {
          drawText("Deposit Paid:", 380, y, 11);
          drawText(formatCurrency(booking.deposit), 480, y, 11);
          y -= lineHeight;

          drawText("Balance Due:", 380, y, 12, true);
          drawText(formatCurrency(booking.balance), 480, y, 12, true);
          y -= lineHeight;
        }

        y -= lineHeight;
        drawText("Thank you for supporting Radio Frimley Park.", left, y, 10);

        const pdfBytes = await doc.save();
        const fs = await import("node:fs/promises");
        await fs.writeFile(result.filePath, pdfBytes);
        log.info(`Invoice PDF saved to ${result.filePath}`);
        return { path: result.filePath };
      }),
  );
}

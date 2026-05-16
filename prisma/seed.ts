import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env["DATABASE_URL"] ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  // App settings
  await prisma.appSettings.upsert({
    where: { id: 1 },
    create: { generatorFee: 20, defaultTeamSize: 3 },
    update: {},
  });

  // Active season
  const season = await prisma.season.create({
    data: {
      name: "2026",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      isActive: true,
      bankHolidays: {
        create: [
          { label: "Good Friday", date: new Date("2026-04-03") },
          { label: "Easter Monday", date: new Date("2026-04-06") },
          { label: "Early May Bank Holiday", date: new Date("2026-05-04") },
          { label: "Spring Bank Holiday", date: new Date("2026-05-25") },
          { label: "Summer Bank Holiday", date: new Date("2026-08-31") },
        ],
      },
    },
  });

  // Members
  const [richard, kieran, lorna, bob, liam, mike] = await Promise.all([
    prisma.member.create({ data: { firstName: "Richard", lastName: "Day", isTeamLeader: true } }),
    prisma.member.create({ data: { firstName: "Kieran", lastName: "Cooke", isTeamLeader: true } }),
    prisma.member.create({ data: { firstName: "Lorna", lastName: "Cooke", isTeamLeader: false } }),
    prisma.member.create({ data: { firstName: "Bob", lastName: "Fisher", isTeamLeader: false } }),
    prisma.member.create({ data: { firstName: "Liam", lastName: "Hale", isTeamLeader: false } }),
    prisma.member.create({ data: { firstName: "Mike", lastName: "Grubb", isTeamLeader: false } }),
  ]);

  // Contacts
  const contact = await prisma.contact.create({
    data: {
      name: "Jess Rogers",
      email: "jess@hookfunrun.com",
      tel: "01256 123456",
    },
  });

  // Bookings
  await prisma.booking.create({
    data: {
      bookingRef: "#2605-01",
      seasonId: season.id,
      date: new Date("2026-05-04"),
      setupTime: "9:30am",
      eventTimeStart: "10:00am",
      eventTimeEnd: "3:00pm",
      eventName: "Hook Fun Run",
      venue: "Hartletts Park",
      location: "Hartletts Park\nHook\nHampshire\nRG27 9NN",
      ragStatus: "RED",
      obUnit: "OB_WAGON",
      generatorRequired: true,
      requiredTeamSize: 3,
      teamLeaderId: richard.id,
      contactId: contact.id,
      fee: 150,
      generatorFee: 20,
      total: 170,
      deposit: 50,
      balance: 120,
      helpers: {
        create: [
          { memberId: liam.id },
          { memberId: mike.id },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      bookingRef: "#2607-02",
      seasonId: season.id,
      date: new Date("2026-07-04"),
      setupTime: "11:00am",
      eventTimeStart: "12:00pm",
      eventTimeEnd: "5:00pm",
      eventName: "Hook Village Show",
      venue: "Hartletts Park",
      location: "Hartletts Park\nHook\nHampshire",
      ragStatus: "GREEN",
      obUnit: "OB_WAGON",
      generatorRequired: true,
      requiredTeamSize: 3,
      teamLeaderId: kieran.id,
      fee: 200,
      generatorFee: 20,
      total: 220,
      deposit: 50,
      balance: 170,
      helpers: {
        create: [
          { memberId: lorna.id },
          { memberId: bob.id },
        ],
      },
    },
  });

  // Schema version
  await prisma.metadata.upsert({
    where: { key: "schema_version" },
    create: { key: "schema_version", value: "1" },
    update: {},
  });

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

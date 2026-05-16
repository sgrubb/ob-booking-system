-- CreateTable
CREATE TABLE "Season" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BankHoliday" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seasonId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    CONSTRAINT "BankHoliday_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "isTeamLeader" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "tel" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bookingRef" TEXT NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "setupTime" TEXT NOT NULL,
    "eventTimeStart" TEXT NOT NULL,
    "eventTimeEnd" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "venue" TEXT,
    "location" TEXT,
    "ragStatus" TEXT NOT NULL DEFAULT 'RED',
    "bookingStatus" TEXT,
    "obUnit" TEXT NOT NULL DEFAULT 'OB_WAGON',
    "doubleBooking" BOOLEAN NOT NULL DEFAULT false,
    "generatorRequired" BOOLEAN NOT NULL DEFAULT false,
    "requiredTeamSize" INTEGER NOT NULL DEFAULT 3,
    "teamLeaderId" INTEGER,
    "contactId" INTEGER,
    "fee" REAL NOT NULL DEFAULT 0,
    "generatorFee" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "deposit" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL DEFAULT 0,
    "invoiceAddress" TEXT,
    "comments" TEXT,
    "cancelledAt" DATETIME,
    "cancelReason" TEXT,
    "cancelNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookingHelper" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bookingId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    CONSTRAINT "BookingHelper_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookingHelper_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "generatorFee" REAL NOT NULL DEFAULT 20,
    "defaultTeamSize" INTEGER NOT NULL DEFAULT 3
);

-- CreateTable
CREATE TABLE "Metadata" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingRef_key" ON "Booking"("bookingRef");

-- CreateIndex
CREATE UNIQUE INDEX "BookingHelper_bookingId_memberId_key" ON "BookingHelper"("bookingId", "memberId");

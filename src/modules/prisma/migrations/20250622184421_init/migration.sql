-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TEXT,
    "patientID" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_patients" ("createdAt", "data", "id", "message", "patientID", "timestamp", "updatedAt") SELECT "createdAt", "data", "id", "message", "patientID", "timestamp", "updatedAt" FROM "patients";
DROP TABLE "patients";
ALTER TABLE "new_patients" RENAME TO "patients";
CREATE UNIQUE INDEX "patients_patientID_key" ON "patients"("patientID");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "unsaved_visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visit_id" INTEGER NOT NULL,
    "data" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "unsaved_visits_visit_id_key" ON "unsaved_visits"("visit_id");

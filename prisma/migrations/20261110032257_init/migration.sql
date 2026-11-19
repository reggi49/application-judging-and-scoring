-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "failed_logins" INTEGER NOT NULL DEFAULT 0,
    "locked_until" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "juri" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kode_juri" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "juri_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "peserta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kode_peserta" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "karya_counter" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "karya" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "peserta_id" INTEGER NOT NULL,
    "akronim_karya" TEXT NOT NULL,
    "no_urut" INTEGER NOT NULL,
    "kode_karya" TEXT NOT NULL,
    "nama_karya" TEXT NOT NULL,
    "deskripsi" TEXT,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "karya_peserta_id_fkey" FOREIGN KEY ("peserta_id") REFERENCES "peserta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "karya_gambar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "karya_id" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "thumb_filename" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "karya_gambar_karya_id_fkey" FOREIGN KEY ("karya_id") REFERENCES "karya" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kriteria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "bobot" DECIMAL NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "penilaian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "client_uuid" TEXT NOT NULL,
    "juri_id" INTEGER NOT NULL,
    "karya_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "catatan" TEXT,
    "skor_juri" DECIMAL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "client_updated_at" BIGINT NOT NULL DEFAULT 0,
    "finalized_at" DATETIME,
    "input_oleh" TEXT NOT NULL DEFAULT 'JURI',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "penilaian_juri_id_fkey" FOREIGN KEY ("juri_id") REFERENCES "juri" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penilaian_karya_id_fkey" FOREIGN KEY ("karya_id") REFERENCES "karya" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "penilaian_detail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "penilaian_id" INTEGER NOT NULL,
    "kriteria_id" INTEGER NOT NULL,
    "nilai" INTEGER NOT NULL,
    "bobot_snapshot" DECIMAL,
    CONSTRAINT "penilaian_detail_penilaian_id_fkey" FOREIGN KEY ("penilaian_id") REFERENCES "penilaian" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "penilaian_detail_kriteria_id_fkey" FOREIGN KEY ("kriteria_id") REFERENCES "kriteria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "penilaian_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "penilaian_id" INTEGER NOT NULL,
    "juri_id" INTEGER NOT NULL,
    "karya_id" INTEGER NOT NULL,
    "aksi" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "actor_user_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "event_setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "fase" TEXT NOT NULL DEFAULT 'PERSIAPAN',
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT,
    "entitas_id" TEXT,
    "data_lama" JSONB,
    "data_baru" JSONB,
    "ip" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "juri_kode_juri_key" ON "juri"("kode_juri");

-- CreateIndex
CREATE UNIQUE INDEX "juri_user_id_key" ON "juri"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "peserta_kode_peserta_key" ON "peserta"("kode_peserta");

-- CreateIndex
CREATE UNIQUE INDEX "karya_kode_karya_key" ON "karya"("kode_karya");

-- CreateIndex
CREATE UNIQUE INDEX "karya_peserta_id_no_urut_key" ON "karya"("peserta_id", "no_urut");

-- CreateIndex
CREATE INDEX "karya_gambar_karya_id_idx" ON "karya_gambar"("karya_id");

-- CreateIndex
CREATE UNIQUE INDEX "kriteria_kode_key" ON "kriteria"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "penilaian_client_uuid_key" ON "penilaian"("client_uuid");

-- CreateIndex
CREATE INDEX "penilaian_karya_id_status_idx" ON "penilaian"("karya_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "penilaian_juri_id_karya_id_key" ON "penilaian"("juri_id", "karya_id");

-- CreateIndex
CREATE UNIQUE INDEX "penilaian_detail_penilaian_id_kriteria_id_key" ON "penilaian_detail"("penilaian_id", "kriteria_id");

-- CreateIndex
CREATE INDEX "penilaian_history_penilaian_id_idx" ON "penilaian_history"("penilaian_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- CreateIndex
CREATE INDEX "audit_log_aksi_idx" ON "audit_log"("aksi");


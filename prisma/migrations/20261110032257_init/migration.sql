-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'JURI') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `must_change_password` BOOLEAN NOT NULL DEFAULT false,
    `failed_logins` INTEGER NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` CHAR(64) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sessions_user_id_idx`(`user_id`),
    INDEX `sessions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `juri` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_juri` VARCHAR(20) NOT NULL,
    `nama` VARCHAR(120) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `juri_kode_juri_key`(`kode_juri`),
    UNIQUE INDEX `juri_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peserta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_peserta` VARCHAR(5) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `deskripsi` TEXT NULL,
    `karya_counter` INTEGER NOT NULL DEFAULT 0,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `peserta_kode_peserta_key`(`kode_peserta`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `karya` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `peserta_id` INTEGER NOT NULL,
    `akronim_karya` VARCHAR(5) NOT NULL,
    `no_urut` INTEGER NOT NULL,
    `kode_karya` VARCHAR(20) NOT NULL,
    `nama_karya` VARCHAR(150) NOT NULL,
    `deskripsi` TEXT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `karya_kode_karya_key`(`kode_karya`),
    UNIQUE INDEX `karya_peserta_id_no_urut_key`(`peserta_id`, `no_urut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `karya_gambar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `karya_id` INTEGER NOT NULL,
    `filename` VARCHAR(80) NOT NULL,
    `thumb_filename` VARCHAR(80) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `is_cover` BOOLEAN NOT NULL DEFAULT false,
    `mime` VARCHAR(40) NOT NULL,
    `size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `karya_gambar_karya_id_idx`(`karya_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kriteria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(30) NOT NULL,
    `nama` VARCHAR(120) NOT NULL,
    `deskripsi` VARCHAR(500) NULL,
    `bobot` DECIMAL(5, 2) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `kriteria_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penilaian` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_uuid` CHAR(36) NOT NULL,
    `juri_id` INTEGER NOT NULL,
    `karya_id` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'FINAL') NOT NULL DEFAULT 'DRAFT',
    `catatan` TEXT NULL,
    `skor_juri` DECIMAL(7, 4) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `client_updated_at` BIGINT NOT NULL DEFAULT 0,
    `finalized_at` DATETIME(3) NULL,
    `input_oleh` ENUM('JURI', 'ADMIN') NOT NULL DEFAULT 'JURI',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `penilaian_client_uuid_key`(`client_uuid`),
    INDEX `penilaian_karya_id_status_idx`(`karya_id`, `status`),
    UNIQUE INDEX `penilaian_juri_id_karya_id_key`(`juri_id`, `karya_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penilaian_detail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `penilaian_id` INTEGER NOT NULL,
    `kriteria_id` INTEGER NOT NULL,
    `nilai` TINYINT UNSIGNED NOT NULL,
    `bobot_snapshot` DECIMAL(5, 2) NULL,

    UNIQUE INDEX `penilaian_detail_penilaian_id_kriteria_id_key`(`penilaian_id`, `kriteria_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penilaian_history` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `penilaian_id` INTEGER NOT NULL,
    `juri_id` INTEGER NOT NULL,
    `karya_id` INTEGER NOT NULL,
    `aksi` VARCHAR(30) NOT NULL,
    `snapshot` JSON NOT NULL,
    `actor_user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `penilaian_history_penilaian_id_idx`(`penilaian_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_setting` (
    `id` INTEGER NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `fase` ENUM('PERSIAPAN', 'PENJURIAN', 'SELESAI') NOT NULL DEFAULT 'PERSIAPAN',
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `aksi` VARCHAR(50) NOT NULL,
    `entitas` VARCHAR(50) NULL,
    `entitas_id` VARCHAR(50) NULL,
    `data_lama` JSON NULL,
    `data_baru` JSON NULL,
    `ip` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_created_at_idx`(`created_at`),
    INDEX `audit_log_aksi_idx`(`aksi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `juri` ADD CONSTRAINT `juri_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `karya` ADD CONSTRAINT `karya_peserta_id_fkey` FOREIGN KEY (`peserta_id`) REFERENCES `peserta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `karya_gambar` ADD CONSTRAINT `karya_gambar_karya_id_fkey` FOREIGN KEY (`karya_id`) REFERENCES `karya`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penilaian` ADD CONSTRAINT `penilaian_juri_id_fkey` FOREIGN KEY (`juri_id`) REFERENCES `juri`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penilaian` ADD CONSTRAINT `penilaian_karya_id_fkey` FOREIGN KEY (`karya_id`) REFERENCES `karya`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penilaian_detail` ADD CONSTRAINT `penilaian_detail_penilaian_id_fkey` FOREIGN KEY (`penilaian_id`) REFERENCES `penilaian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penilaian_detail` ADD CONSTRAINT `penilaian_detail_kriteria_id_fkey` FOREIGN KEY (`kriteria_id`) REFERENCES `kriteria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Pengaman integritas di level database (tidak hanya di UI/API)
-- ---------------------------------------------------------------------------
ALTER TABLE `penilaian_detail`
  ADD CONSTRAINT `chk_nilai_0_100` CHECK (`nilai` BETWEEN 0 AND 100);

ALTER TABLE `kriteria`
  ADD CONSTRAINT `chk_bobot_range` CHECK (`bobot` > 0 AND `bobot` <= 100);

ALTER TABLE `peserta`
  ADD CONSTRAINT `chk_kode_peserta` CHECK (REGEXP_LIKE(`kode_peserta`, '^[A-Z0-9]{2,5}$', 'c'));

ALTER TABLE `karya`
  ADD CONSTRAINT `chk_akronim_karya` CHECK (REGEXP_LIKE(`akronim_karya`, '^[A-Z0-9]{2,5}$', 'c')),
  ADD CONSTRAINT `chk_no_urut` CHECK (`no_urut` BETWEEN 1 AND 999);

ALTER TABLE `penilaian`
  ADD CONSTRAINT `chk_skor_juri` CHECK (`skor_juri` IS NULL OR (`skor_juri` >= 0 AND `skor_juri` <= 100));

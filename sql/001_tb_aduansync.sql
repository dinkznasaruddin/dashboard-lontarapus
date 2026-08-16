-- Migration: tb_aduansync
-- Menyimpan seluruh data aduan dari workflow API sebagai sumber data utama
-- dashboard aduan. Diisi/diperbarui oleh scripts/warmup-aduan.mjs (upsert).
-- Dijalankan sekali: mysql ... superapps < sql/001_tb_aduansync.sql

CREATE TABLE IF NOT EXISTS tb_aduansync (
  ticketid          BIGINT       NOT NULL,
  Layanan           VARCHAR(255) NULL,
  waktu_aduan       DATETIME     NULL,
  first_reply_date  DATETIME     NULL,
  first_reply_message MEDIUMTEXT  NULL,
  waktu_respon_opd  DATETIME     NULL,
  opd_first_reply_message MEDIUMTEXT NULL,
  last_reply_date   DATETIME     NULL,
  last_reply_message MEDIUMTEXT  NULL,
  durasi_first_reply VARCHAR(50) NULL,
  durasi_opd_response VARCHAR(50) NULL,
  durasi_replies_first_last VARCHAR(50) NULL,
  nama_pelapor      VARCHAR(255) NULL,
  pesan_aduan       MEDIUMTEXT   NULL,
  status            VARCHAR(100) NULL,
  kategori          VARCHAR(255) NULL,
  no_hp             VARCHAR(50)  NULL,
  tanggal           VARCHAR(50)  NULL,
  longlat           VARCHAR(255) NULL,
  alamat            TEXT           NULL,
  kecamatan         VARCHAR(255) NULL,
  kelurahan         VARCHAR(255) NULL,
  updated_at        TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ticketid),
  KEY idx_waktu_aduan (waktu_aduan),
  KEY idx_status (status),
  KEY idx_kategori (kategori),
  KEY idx_layanan (Layanan),
  KEY idx_kecamatan (kecamatan),
  KEY idx_kelurahan (kelurahan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
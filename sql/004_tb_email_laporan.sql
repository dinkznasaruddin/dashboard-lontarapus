-- Migration: tb_email_laporan
-- Format laporan email harian (nama, kode generator, subjek, penerima).
-- Digunakan fitur "Kirim Laporan Email" (src/lib/email-model.ts).
-- Dijalankan sekali: mysql ... superapps < sql/004_tb_email_laporan.sql

CREATE TABLE IF NOT EXISTS tb_email_laporan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kode VARCHAR(100) NOT NULL,
  subjek VARCHAR(255) NOT NULL,
  penerima TEXT NOT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_kode (kode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed awal: format laporan aduan harian
INSERT INTO tb_email_laporan (nama, kode, subjek, penerima)
SELECT 'Laporan Aduan Harian', 'aduan_harian', 'Laporan Aduan Harian - {tanggal}',
       'cutmeurahrudi@gmail.com
gita.namirah@gmail.com
dinkznasaruddin91@gmail.com
nasaruddin@makassarkota.go.id'
WHERE NOT EXISTS (SELECT 1 FROM tb_email_laporan WHERE kode = 'aduan_harian');
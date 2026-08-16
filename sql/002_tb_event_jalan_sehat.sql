-- Migration: tb_event_jalan_sehat
-- Menyimpan seluruh data registrasi Jalan Sehat dari workflow API
-- (event_type=jalansehat) sebagai sumber data utama dashboard.
-- Diisi/diperbarui oleh scripts/warmup-jalansantai.mjs (upsert).
-- Dijalankan sekali: mysql ... superapps < sql/002_tb_event_jalan_sehat.sql

CREATE TABLE IF NOT EXISTS tb_event_jalan_sehat (
  id                   BIGINT       NOT NULL,
  ticket_number        VARCHAR(50)  NULL,
  form_event_type      VARCHAR(50)  NULL,
  form_user_id         VARCHAR(64)  NULL,
  form_nik_number      VARCHAR(50)  NULL,
  form_nip_number      VARCHAR(50)  NULL,
  form_institution_name VARCHAR(255) NULL,
  form_user_email      VARCHAR(255) NULL,
  form_phone_number    VARCHAR(50)  NULL,
  form_fullname        VARCHAR(255) NULL,
  form_district_id     VARCHAR(50)  NULL,
  form_district_name   VARCHAR(255) NULL,
  form_subdistrict_id  VARCHAR(50)  NULL,
  form_subdistrict_name VARCHAR(255) NULL,
  form_participant_type VARCHAR(50)  NULL,
  form_user_consent    TINYINT(1)   NULL,
  api_nik_number       VARCHAR(50)  NULL,
  api_phone_number     VARCHAR(50)  NULL,
  api_user_email       VARCHAR(255) NULL,
  api_fullname         VARCHAR(255) NULL,
  created_at           DATETIME     NULL,
  updated_at           TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_created_at (created_at),
  KEY idx_participant_type (form_participant_type),
  KEY idx_district (form_district_name),
  KEY idx_subdistrict (form_subdistrict_name),
  KEY idx_institution (form_institution_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
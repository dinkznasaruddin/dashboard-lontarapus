/**
 * Server-only: Laporan Aduan Harian via email (port dari send-email-native.php).
 * - Data aduan diambil dari API workflow (sama seperti dashboard aduan).
 * - Statistik per layanan dihitung, email HTML digenerate.
 * - Dikirim via SMTP native (node net/tls), auto-detect port 25/587/465.
 */

import "server-only";
import net from "net";
import tls from "tls";
import crypto from "crypto";
import { fetchAllComplaints } from "@/lib/apis";
import type { Aduan } from "@/lib/aduan";

/* ------------------------------ Konfigurasi ------------------------------ */

const SMTP_HOST = process.env.SMTP_HOST || "10.1.6.173";
const SMTP_USER = process.env.SMTP_USER || "report@aduan.makassarkota.go.id";
const SMTP_PASS = process.env.SMTP_PASS || "jcNDdBXSpXE+";
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || "report@aduan.makassarkota.go.id";
const FROM_NAME = process.env.SMTP_FROM_NAME || "Sistem Laporan Aduan Makassar";

const DEFAULT_RECIPIENTS = [
  "cutmeurahrudi@gmail.com",
  "gita.namirah@gmail.com",
  "dinkznasaruddin91@gmail.com",
  "nasaruddin@makassarkota.go.id",
];

export interface EmailConfig {
  host: string;
  user: string;
  portInfo: string;
  fromEmail: string;
  fromName: string;
  recipients: string[];
}

export function getEmailConfig(): EmailConfig {
  const recipients = (process.env.SMTP_RECIPIENTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    host: SMTP_HOST,
    user: SMTP_USER,
    portInfo: "Auto-detect (25/587/465)",
    fromEmail: FROM_EMAIL,
    fromName: FROM_NAME,
    recipients: recipients.length > 0 ? recipients : DEFAULT_RECIPIENTS,
  };
}

/* ------------------------------- Statistik ------------------------------- */

export interface LayananStat {
  layanan: string;
  total: number;
  selesai: number;
  inprogress: number;
  selesai_cepat: number;
  selesai_lambat: number;
}

/** Port dari calculateLayananStats() PHP. */
export function calculateLayananStats(aduanData: Aduan[]): LayananStat[] {
  const map = new Map<string, LayananStat>();
  for (const aduan of aduanData) {
    const layanan = aduan.Layanan || "Unknown";
    const status = aduan.status || "Unknown";
    let stat = map.get(layanan);
    if (!stat) {
      stat = { layanan, total: 0, selesai: 0, inprogress: 0, selesai_cepat: 0, selesai_lambat: 0 };
      map.set(layanan, stat);
    }
    stat.total++;
    if (status === "Closed") {
      stat.selesai++;
      if (aduan.durasi_replies_first_last) {
        const m = /^(\d+):(\d+)$/.exec(aduan.durasi_replies_first_last.trim());
        if (m) {
          const totalHours = Number(m[1]) + Number(m[2]) / 60;
          if (totalHours <= 48) stat.selesai_cepat++;
          else stat.selesai_lambat++;
        }
      }
    } else if (["Open", "In progress", "On Hold", "Answered"].includes(status)) {
      stat.inprogress++;
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export interface LaporanSummary {
  totalLayanan: number;
  totalAduan: number;
  totalSelesai: number;
}

export function summarize(stats: LayananStat[]): LaporanSummary {
  return {
    totalLayanan: stats.length,
    totalAduan: stats.reduce((s, x) => s + x.total, 0),
    totalSelesai: stats.reduce((s, x) => s + x.selesai, 0),
  };
}

/* --------------------------- Generate HTML email ------------------------- */

/** Port dari generateEmailHTML() PHP — template email laporan harian. */
export function generateEmailHTML(stats: LayananStat[]): string {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const year = new Date().getFullYear();
  const summary = summarize(stats);
  const num = (n: number) => n.toLocaleString("id-ID");

  const rows = stats
    .map(
      (s, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${escapeHtml(s.layanan)}</td>
                        <td class="number">${num(s.total)}</td>
                        <td class="number">${num(s.selesai)}</td>
                        <td class="number">${num(s.inprogress)}</td>
                        <td class="number">${num(s.selesai_cepat)}</td>
                        <td class="number">${num(s.selesai_lambat)}</td>
                    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Aduan Harian</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f5f5f5;
            padding: 40px 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            overflow: hidden;
        }
        .header {
            background: #B21D28;
            color: white;
            text-align: center;
            padding: 35px 20px;
        }
        .header h1 { font-size: 26px; font-weight: 600; margin-bottom: 8px; letter-spacing: -0.5px; }
        .header p { font-size: 14px; opacity: 0.9; margin: 4px 0; }
        .content { padding: 40px; }
        .summary { display: flex; gap: 20px; margin-bottom: 40px; }
        .summary-card {
            flex: 1;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-left: 4px solid #B21D28;
            padding: 25px 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-card:nth-child(2) { border-left-color: #d05a62; }
        .summary-card:nth-child(3) { border-left-color: #e08a90; }
        .summary-card h3 { font-size: 36px; font-weight: 700; color: #B21D28; margin-bottom: 6px; }
        .summary-card p { font-size: 13px; font-weight: 500; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; }
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            overflow: hidden;
        }
        thead { background: #f8f9fa; border-bottom: 2px solid #dee2e6; }
        th { color: #495057; padding: 14px 12px; text-align: center; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f1f3f5; text-align: center; color: #495057; }
        td:first-child { font-weight: 600; color: #B21D28; }
        td:nth-child(2) { text-align: left; font-weight: 500; color: #212529; }
        tbody tr:hover { background: #f8f9fa; }
        tbody tr:last-child td { border-bottom: none; }
        .number { font-weight: 600; color: #B21D28; }
        .footer { background: #f8f9fa; text-align: center; padding: 25px; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
        .footer p { margin: 4px 0; }
        .footer strong { color: #B21D28; }
        @media (max-width: 600px) {
            .summary { flex-direction: column; }
            .content { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Laporan Aduan Harian</h1>
            <p>Pemerintah Kota Makassar</p>
            <p><strong>${today}</strong></p>
        </div>

        <div class="content">
            <div class="summary">
                <div class="summary-card">
                    <h3>${num(summary.totalLayanan)}</h3>
                    <p>Total Layanan</p>
                </div>
                <div class="summary-card">
                    <h3>${num(summary.totalAduan)}</h3>
                    <p>Total Aduan</p>
                </div>
                <div class="summary-card">
                    <h3>${num(summary.totalSelesai)}</h3>
                    <p>Aduan Selesai</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">No</th>
                        <th style="width: 28%;">Nama Layanan</th>
                        <th style="width: 11%;">Total Aduan</th>
                        <th style="width: 12%;">Selesai</th>
                        <th style="width: 14%;">In Progress</th>
                        <th style="width: 15%;">Selesai ≤ 48 Jam</th>
                        <th style="width: 15%;">Selesai > 48 Jam</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p><strong>Sistem Laporan Aduan Otomatis</strong></p>
            <p>Pemerintah Kota Makassar © ${year}</p>
            <p style="margin-top: 8px;">Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
        </div>
    </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ------------------------- Kirim email (SMTP native) ---------------------- */

interface SmtpResult {
  ok: boolean;
  port?: number;
  sentTo?: string[];
  error?: string;
  log: string[];
}

/**
 * Port dari sendEmailNative() PHP: raw socket SMTP.
 * - Auto-detect port 25 → 587 (STARTTLS) → 465 (TLS langsung).
 * - EHLO → (STARTTLS/TLS) → AUTH LOGIN → MAIL FROM → RCPT TO → DATA → QUIT.
 * - Body multipart/alternative (text/plain + text/html), dikirim per penerima.
 */
export async function sendEmailReport(
  recipients: string[],
  subject: string,
  htmlBody: string
): Promise<SmtpResult> {
  const log: string[] = [];
  const push = (msg: string) => log.push(msg);

  const portsToTry = [25, 587, 465];
  let port = -1;

  for (const p of portsToTry) {
    push(`Trying ${SMTP_HOST}:${p}...`);
    const ok = await probeConnect(p, 4000);
    if (ok) {
      port = p;
      push(`Connected on port ${p}`);
      break;
    }
    push(`Port ${p} failed`);
  }

  if (port === -1) {
    return { ok: false, log, error: "SMTP connection failed on all ports (25, 587, 465)" };
  }

  try {
    let conn: Stream = await openConnection(SMTP_HOST, port);
    const sentTo: string[] = [];

    // Greeting
    const greeting = await readLine(conn);
    push(`Greeting: ${greeting.trim()}`);

    // EHLO
    await sendLine(conn, `EHLO localhost.localdomain`);
    await drainMultiline(conn);

    // STARTTLS (587) atau TLS langsung (465)
    if (port === 587) {
      await sendLine(conn, `STARTTLS`);
      const starttlsResp = await readLine(conn);
      push(`STARTTLS: ${starttlsResp.trim()}`);
      if (starttlsResp.startsWith("220")) {
        conn = await upgradeTls(conn, SMTP_HOST);
        push("TLS aktif, EHLO ulang...");
        await sendLine(conn, `EHLO localhost.localdomain`);
        await drainMultiline(conn);
      }
    }

    // AUTH LOGIN
    await sendLine(conn, `AUTH LOGIN`);
    await readLine(conn); // 334
    await sendLine(conn, Buffer.from(SMTP_USER).toString("base64"));
    await readLine(conn); // 334
    await sendLine(conn, Buffer.from(SMTP_PASS).toString("base64"));
    const authResp = await readLine(conn);
    push(`AUTH: ${authResp.trim()}`);
    if (!authResp.startsWith("235")) {
      conn.destroy();
      return { ok: false, log, error: `SMTP authentication failed: ${authResp.trim()}` };
    }

    // Kirim ke tiap penerima
    for (const to of recipients) {
      await sendLine(conn, `MAIL FROM: <${FROM_EMAIL}>`);
      await readLine(conn);
      await sendLine(conn, `RCPT TO: <${to}>`);
      const rcpt = await readLine(conn);
      await sendLine(conn, `DATA`);
      const dataResp = await readLine(conn);

      const boundary = crypto.randomBytes(16).toString("hex");
      const headers = [
        `From: ${FROM_NAME} <${FROM_EMAIL}>`,
        `To: <${to}>`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ].join("\r\n");

      const body = [
        `--${boundary}`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        stripHtml(htmlBody),
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        htmlBody,
        ``,
        `--${boundary}--`,
      ].join("\r\n");

      await sendRaw(conn, `${headers}\r\n\r\n${dotStuff(body)}\r\n.\r\n`);
      const sendResp = await readLine(conn);
      if (sendResp.startsWith("250")) {
        push(`Sent to ${to}: ${sendResp.trim()}`);
        sentTo.push(to);
      } else {
        push(`Unexpected response for ${to}: ${sendResp.trim()}`);
      }
    }

    await sendLine(conn, `QUIT`);
    conn.destroy();
    push("Connection closed. All emails processed.");

    return { ok: sentTo.length > 0, port, sentTo, log };
  } catch (e) {
    return { ok: false, port, error: (e as Error).message, log };
  }
}

/* --------------------------- SMTP helpers (raw) --------------------------- */

type Stream = net.Socket | tls.TLSSocket;

function probeConnect(port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ host: SMTP_HOST, port }, () => {
      sock.destroy();
      resolve(true);
    });
    sock.on("error", () => {
      sock.destroy();
      resolve(false);
    });
    sock.setTimeout(timeoutMs, () => {
      sock.destroy();
      resolve(false);
    });
  });
}

function openConnection(host: string, port: number): Promise<Stream> {
  return new Promise((resolve, reject) => {
    if (port === 465) {
      const sock = tls.connect({ host, port, servername: host }, () => resolve(sock));
      sock.on("error", reject);
      sock.setTimeout(15_000, () => reject(new Error("SMTP connect timeout")));
    } else {
      const sock = net.connect({ host, port }, () => resolve(sock));
      sock.on("error", reject);
      sock.setTimeout(15_000, () => reject(new Error("SMTP connect timeout")));
    }
  });
}

function upgradeTls(conn: net.Socket, host: string): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    conn.on("error", () => {}); // cegah unhandled 'error' pada socket lama setelah di-wrap TLS
    const tlsSocket = tls.connect({ socket: conn, servername: host }, () => resolve(tlsSocket));
    tlsSocket.on("error", reject);
    tlsSocket.setTimeout(15_000, () => reject(new Error("TLS handshake timeout")));
  });
}

function sendLine(conn: Stream, line: string): Promise<void> {
  return sendRaw(conn, `${line}\r\n`);
}

function sendRaw(conn: Stream, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    conn.write(data, (err) => (err ? reject(err) : resolve()));
  });
}

function readLine(conn: Stream, timeoutMs = 15_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    let timer: NodeJS.Timeout | null = null;
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      if (buffer.includes("\n")) {
        cleanup();
        const [line] = buffer.split("\n");
        resolve(line.replace(/\r$/, ""));
      }
    };
    const onErr = (e: Error) => {
      cleanup();
      reject(e);
    };
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      conn.removeListener("data", onData);
      conn.removeListener("error", onErr);
    };
    timer = setTimeout(() => {
      cleanup();
      reject(new Error("SMTP read timeout"));
    }, timeoutMs);
    conn.on("data", onData);
    conn.on("error", onErr);
  });
}

/** Baca respons multiline EHLO (beberapa baris 250-...). */
function drainMultiline(conn: Stream, timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    let timer: NodeJS.Timeout | null = null;
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      // Multiline selesai ketika baris terakhir diawali "250 " (dengan spasi).
      if (/(^|\r?\n)250 /m.test(buffer) || /(^|\r?\n)220 /m.test(buffer)) {
        cleanup();
        resolve();
      }
    };
    const onErr = (e: Error) => {
      cleanup();
      reject(e);
    };
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      conn.removeListener("data", onData);
      conn.removeListener("error", onErr);
    };
    timer = setTimeout(() => {
      cleanup();
      reject(new Error("SMTP multiline read timeout"));
    }, timeoutMs);
    conn.on("data", onData);
    conn.on("error", onErr);
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Dot-stuffing: baris yang diawali "." harus digandakan agar tidak dianggap terminator DATA. */
function dotStuff(text: string): string {
  return text.replace(/^\./gm, "..");
}

/** Ambil statistik untuk preview (dipakai halaman dashboard). */
export async function buildLaporanReport(): Promise<{
  stats: LayananStat[];
  summary: LaporanSummary;
  subject: string;
  html: string;
}> {
  const aduan = await fetchAllComplaintsWithRetry<Aduan>();
  const stats = calculateLayananStats(aduan);
  const summary = summarize(stats);
  const subject = `Laporan Aduan Harian - ${new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}`;
  return { stats, summary, subject, html: generateEmailHTML(stats) };
}

/* --------------------- Registry format email (per kode) ------------------- */

export interface EmailFormatResult {
  subject: string;
  html: string;
  summary?: LaporanSummary;
}

/** Daftar generator yang dikenal. Kode di kolom `kode` tabel tb_email_laporan
 *  harus terdaftar di sini; tambahkan di sini bila format baru dibuat. */
const FORMAT_GENERATORS: Record<string, () => Promise<EmailFormatResult>> = {
  aduan_harian: async () => {
    const report = await buildLaporanReport();
    return { subject: report.subject, html: report.html, summary: report.summary };
  },
};

/** Apakah kode format didukung generator. */
export function isKnownFormat(kode: string): boolean {
  return kode in FORMAT_GENERATORS;
}

/** Jalankan generator sesuai kode format. */
export async function runFormatGenerator(kode: string): Promise<EmailFormatResult> {
  const gen = FORMAT_GENERATORS[kode];
  if (!gen) throw new Error(`Format email "${kode}" tidak dikenal`);
  return gen();
}

/** fetchAllComplaints + retry (API workflow intermitten 502/503). */
async function fetchAllComplaintsWithRetry<T>(): Promise<T[]> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await fetchAllComplaints<T>(0);
    } catch (err) {
      lastErr = err;
      console.error(`[email-report] fetch aduan gagal (percobaan ${attempt}):`, (err as Error).message);
      if (attempt < 4) await new Promise((r) => setTimeout(r, 4000 * attempt));
    }
  }
  throw lastErr;
}
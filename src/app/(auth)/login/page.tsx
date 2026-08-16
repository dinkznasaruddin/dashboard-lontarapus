"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, ShieldAlert, User } from "lucide-react";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    if (document.getElementById("grecaptcha-v3") || window.grecaptcha) return;
    const s = document.createElement("script");
    s.id = "grecaptcha-v3";
    s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    s.async = true;
    s.onload = () => setRecaptchaReady(true);
    s.onerror = () => setRecaptchaReady(false);
    document.head.appendChild(s);
  }, []);

  const [recaptchaReady, setRecaptchaReady] = useState<boolean | null>(null);

  async function getRecaptchaToken(): Promise<string | null> {
    if (!RECAPTCHA_SITE_KEY || typeof window === "undefined") return null;

    // Tunggu script reCAPTCHA termuat (max 8 detik)
    if (!window.grecaptcha) {
      await new Promise<void>((resolve) => {
        const start = Date.now();
        const poll = () => {
          if (window.grecaptcha || Date.now() - start > 8000) return resolve();
          setTimeout(poll, 100);
        };
        poll();
      });
    }

    if (!window.grecaptcha) return null;

    try {
      const token = await new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("timeout")), 10000);
        window.grecaptcha!.ready(async () => {
          try {
            const t = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, {
              action: "login",
            });
            clearTimeout(timer);
            resolve(t);
          } catch (e) {
            clearTimeout(timer);
            reject(e);
          }
        });
      });
      return token;
    } catch {
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const recaptchaToken = await getRecaptchaToken();
      if (!recaptchaToken) {
        setError("Gagal memuat verifikasi keamanan. Muat ulang halaman dan coba lagi.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal login");
        setLoading(false);
        return;
      }
      if (data.token && window.location.protocol === "https:") {
        document.cookie =
          "lontara_session=" +
          data.token +
          "; path=/; max-age=28800; samesite=lax; secure";
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan koneksi");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
          Username
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            placeholder="Masukkan username"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-[0.93rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#B21D28] focus:ring-4 focus:ring-[#B21D28]/10"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Masukkan password"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-[0.93rem] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#B21D28] focus:ring-4 focus:ring-[#B21D28]/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:text-slate-600"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {recaptchaReady === false ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          Verifikasi keamanan gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d02b29] to-[#b92321] text-[0.95rem] font-semibold text-white shadow-lg shadow-red-700/20 transition hover:-translate-y-px hover:shadow-xl hover:shadow-red-700/25 disabled:translate-y-0 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            Masuk
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fafbfc] px-4 py-10">
      {/* Dekorasi background */}
      <div className="pointer-events-none absolute -left-44 -top-44 h-[460px] w-[460px] rounded-full bg-[#B21D28]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 -right-44 h-[500px] w-[500px] rounded-full bg-blue-700/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-teal-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-10">
          <div className="mb-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/logo-lontara.png"
              alt="Lontara+"
              className="mx-auto h-12 w-auto object-contain"
            />
            <h1 className="mt-5 text-[1.55rem] font-semibold tracking-tight text-[#16213a]">
              Selamat datang kembali
            </h1>
            <p className="mt-1.5 text-sm text-[#667085]">
              Masuk untuk mengakses Dashboard Lontara+
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Pemerintah Kota Makassar · Lontara+
        </p>
      </div>
    </div>
  );
}

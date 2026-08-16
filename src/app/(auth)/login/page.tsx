"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal login");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan koneksi");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="mb-2 block text-[0.85rem] font-medium text-slate-700">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          placeholder="Username"
          className="h-12 w-full rounded-[0.6rem] border border-[#d4d8e4] px-4 text-[0.93rem] outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-[0.85rem] font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-12 w-full rounded-[0.6rem] border border-[#d4d8e4] px-4 pr-12 text-[0.93rem] outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[0.65rem] bg-gradient-to-r from-[#d02b29] to-[#b92321] text-[0.9rem] font-semibold text-white shadow-lg shadow-red-700/20 transition hover:-translate-y-px hover:shadow-xl hover:shadow-red-700/25 disabled:translate-y-0 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          "Masuk"
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-white">
      <div className="relative mx-auto grid w-full max-w-[1320px] items-center gap-10 px-[4.5vw] py-16 lg:grid-cols-[minmax(380px,1.12fr)_minmax(390px,0.88fr)] lg:gap-20">
        {/* Hero */}
        <section className="relative z-10 max-w-[640px] py-4 text-center lg:pr-9 lg:text-left">
          <div className="mb-9 flex items-center justify-center gap-3 lg:justify-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-lontara.png" alt="Lontara+" className="h-12 w-auto object-contain" />
          </div>
          <div className="hidden lg:block">
            <h1 className="mb-4 text-[clamp(2.2rem,3.9vw,3.7rem)] font-medium leading-[1.08] tracking-tight text-[#16213a]">
              Dashboard Lontara+ Satu Kota Satu App
            </h1>
            <p className="max-w-[35rem] text-[0.95rem] leading-[1.65] text-[#667085]">
              Platform Dashboard terpadu untuk monitoring data
              <br /> seluruh layanan publik pada Aplikasi Lontara+.
            </p>
          </div>
        </section>

        {/* Panel */}
        <section className="relative z-10 flex flex-col items-stretch justify-center lg:pl-9 lg:[&::before]:absolute lg:[&::before]:-left-9 lg:[&::before]:top-[12%] lg:[&::before]:bottom-[12%] lg:[&::before]:w-px lg:[&::before]:bg-gradient-to-b lg:[&::before]:from-transparent lg:[&::before]:via-blue-600/20 lg:[&::before]:to-transparent">
          <div className="rounded-2xl border border-slate-200 bg-white p-9 lg:px-[2.2rem] lg:py-[2.35rem]">
            <div className="mb-5 text-center">
              <h2 className="whitespace-nowrap text-[1.4rem] font-medium tracking-tight text-[#182033]">
                Selamat datang kembali
              </h2>
              <p className="mt-1 text-[0.87rem] text-[#667085]">Masuk untuk mengakses dashboard Anda</p>
            </div>
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </div>

      <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-xs text-slate-400">
        © {new Date().getFullYear()} Pemerintah Kota Makassar · Lontara+
      </p>
    </div>
  );
}
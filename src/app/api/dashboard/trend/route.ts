import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { loadDashboardData, TREND_YEAR_MIN } from "@/lib/dashboard-data";

export async function GET(request: NextRequest) {
  await requireAuth();

  const currentYear = new Date().getFullYear();
  const tahun = Number(request.nextUrl.searchParams.get("tahun"));
  let filterYear = tahun;
  if (!filterYear || filterYear < TREND_YEAR_MIN || filterYear > currentYear) {
    filterYear = currentYear;
  }

  const data = await loadDashboardData(filterYear, currentYear);

  return NextResponse.json({
    tahun: filterYear,
    event: data.event.perBulan,
    aduan: data.aduan.perBulan,
    register: data.register.perBulan,
  });
}
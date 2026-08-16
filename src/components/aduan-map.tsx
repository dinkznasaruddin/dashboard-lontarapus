"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { MarkerClusterGroup } from "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { AduanLocation } from "@/lib/aduan";

const STATUS_COLORS: Record<string, string> = {
  "In progress": "#f6c23e",
  Closed: "#1cc88a",
  "On Hold": "#e74a3b",
};
const DEFAULT_COLOR = "#6c757d";

const LEGEND_STATUSES = Object.entries(STATUS_COLORS);

function makeIcon(L: typeof Leaflet, status: string) {
  const color = STATUS_COLORS[status] ?? DEFAULT_COLOR;
  return L.divIcon({
    className: "bg-transparent border-0",
    html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export function AduanMap({ locations }: { locations: AduanLocation[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layerRef = useRef<MarkerClusterGroup | null>(null);
  const legendRef = useRef<{ remove: () => void } | null>(null);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState("");

  // Lazy-load Leaflet + markercluster (avoids `window is not defined` during SSR) then init map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("leaflet");
      const L = mod.default ?? mod;
      const clusterMod = await import("leaflet.markercluster");
      const LCluster = clusterMod.default ?? clusterMod;
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(containerRef.current).setView([-5.133333, 119.416667], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      mapRef.current = map;
      // Gunakan clustering agar ribuan titik tidak dirender satu per satu
      // (Leaflet sangat lambat dengan >2-3rb marker DOM).
      layerRef.current = new LCluster.MarkerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        chunkedLoading: true,
        chunkInterval: 150,
        chunkDelay: 80,
      }).addTo(map);

      // Legenda sebagai Leaflet control asli — menempel permanen di dalam map
      // (kiri atas), tidak bergeser saat peta di-drag/zoom.
      const legend = new L.Control({ position: "bottomleft" });
      legend.onAdd = () => {
        const el = L.DomUtil.create("div", "leaflet-control");
        el.innerHTML = `
          <div style="background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.12); padding: 10px 14px;">
            <p style="margin: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; text-align: center;">Legenda</p>
            ${LEGEND_STATUSES.map(
              ([status, color]) => `
                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #334155; line-height: 1.8; white-space: nowrap;">
                  <span style="display:inline-block; width: 9px; height: 9px; border-radius: 50%; background-color: ${color};"></span>
                  ${status}
                </div>`
            ).join("")}
          </div>`;
        return el;
      };
      legend.addTo(map);
      legendRef.current = legend;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
        legendRef.current = null;
      }
    };
  }, []);

  const term = query.trim().toLowerCase();

  // Render markers whenever locations/query change
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;

    const filtered = !term
      ? locations
      : locations.filter((l) =>
          [
            l.nama_pelapor,
            l.alamat,
            l.kategori,
            l.kecamatan,
            l.kelurahan,
            l.ticketid,
            l.no_hp,
            l.pesan_aduan,
          ]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(term))
        );

    layer.clearLayers();
    filtered.forEach((loc) => {
      const marker = L.marker([loc.latitude, loc.longitude], { icon: makeIcon(L, loc.status) });
      const popup = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 220px;">
          <h6 style="margin: 0 0 4px;"><strong>Ticket #${loc.ticketid}</strong></h6>
          <hr style="margin: 4px 0;">
          <p style="margin: 2px 0;"><strong>Pelapor:</strong> ${loc.nama_pelapor || "-"}</p>
          <p style="margin: 2px 0;"><strong>No. HP:</strong> ${loc.no_hp || "-"}</p>
          <p style="margin: 2px 0;"><strong>Kategori:</strong> ${loc.kategori || "-"}</p>
          <p style="margin: 2px 0;"><strong>Status:</strong> ${loc.status || "-"}</p>
          <p style="margin: 2px 0;"><strong>Alamat:</strong> ${loc.alamat || "-"}</p>
          <p style="margin: 2px 0;"><strong>Kecamatan:</strong> ${loc.kecamatan || "-"}</p>
          <p style="margin: 2px 0;"><strong>Kelurahan:</strong> ${loc.kelurahan || "-"}</p>
          <p style="margin: 2px 0;"><strong>Waktu:</strong> ${loc.waktu_aduan || "-"}</p>
          <p style="margin: 6px 0 2px;"><strong>Pesan Aduan:</strong></p>
          <div style="max-height: 100px; overflow-y: auto; background: #f8f9fc; padding: 6px; border-radius: 4px;">
            ${loc.pesan_aduan || "Tidak ada pesan"}
          </div>
          <p style="margin: 6px 0 0;"><strong>Koordinat:</strong> ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}</p>
        </div>`;
      marker.bindPopup(popup, { maxWidth: 300 });
      layer.addLayer(marker);
    });

    // Hanya geser view saat pencarian aktif (fitBounds ke hasil cari).
    // Pada pemuatan awal, biarkan map tetap di view Makassar (zoom 12).
    if (term && filtered.length > 0) {
      if (filtered.length === 1) {
        map.setView([filtered[0].latitude, filtered[0].longitude], 15);
      } else {
        map.fitBounds(layer.getBounds().pad(0.2));
      }
    }

    setSearchResult(
      `${filtered.length} dari ${locations.length} lokasi${term ? ` untuk "${query}"` : ""}`
    );
  }, [locations, query, term, ready]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari Ticket ID, pelapor, alamat, kategori..."
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50"
          >
            Bersihkan
          </button>
        )}
        <span className="text-sm text-slate-500">{searchResult}</span>
      </div>
      <div className="relative">
        <div ref={containerRef} className="h-[500px] w-full rounded-lg border border-slate-200" />
      </div>
    </div>
  );
}
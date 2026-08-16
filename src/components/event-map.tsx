"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    L?: any;
  }
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const GEOCODER_CSS = "https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const GEOCODER_JS = "https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js";
const DEFAULT_LAT = -5.147665;
const DEFAULT_LNG = 119.432732;

function loadCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Gagal memuat ${src}`));
    document.body.appendChild(s);
  });
}

/** Peta pemilih lokasi (Leaflet) untuk form event — update latitude/longitude. */
export function EventMap({ lat, lng }: { lat?: string; lng?: string }) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let map: any = null;
    let cancelled = false;

    const init = async () => {
      loadCss(LEAFLET_CSS);
      loadCss(GEOCODER_CSS);
      try {
        if (!window.L) await loadScript(LEAFLET_JS);
        await loadScript(GEOCODER_JS);
      } catch {
        return;
      }
      if (cancelled || !mapDiv.current || !window.L) return;
      const L = window.L;

      const startLat = parseFloat(lat ?? "") || DEFAULT_LAT;
      const startLng = parseFloat(lng ?? "") || DEFAULT_LNG;

      map = L.map(mapDiv.current).setView([startLat, startLng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);

      const updateInputs = (latlng: { lat: number; lng: number }) => {
        if (latRef.current) latRef.current.value = latlng.lat.toFixed(6);
        if (lngRef.current) lngRef.current.value = latlng.lng.toFixed(6);
      };

      marker.on("dragend", (e: any) => updateInputs(e.target.getLatLng()));
      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        updateInputs(e.latlng);
      });

      if (L.Control?.Geocoder) {
        L.Control.geocoder({ defaultMarkGeocode: false })
          .on("markgeocode", (e: any) => {
            const latlng = e.geocode.center;
            map.setView(latlng, 16);
            marker.setLatLng(latlng);
            updateInputs(latlng);
          })
          .addTo(map);
      }
    };

    init();
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [lat, lng]);

  return (
    <div>
      <div ref={mapDiv} className="h-[400px] w-full rounded-lg border border-slate-200" />
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Latitude</label>
          <input
            ref={latRef}
            name="latitude"
            type="text"
            defaultValue={lat ?? ""}
            placeholder="-5.147665"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Longitude</label>
          <input
            ref={lngRef}
            name="longitude"
            type="text"
            defaultValue={lng ?? ""}
            placeholder="119.432732"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
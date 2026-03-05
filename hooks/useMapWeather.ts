/**
 * Real weather at map center — Open-Meteo API.
 * Refresh on map open and debounced on camera idle (center moved > ~5km or last fetch > 12 min).
 */

import { useState, useCallback, useRef } from 'react';
import { weatherCodeToMode, type WeatherMode } from '../constants/WeatherMode';

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
const REFRESH_DEBOUNCE_MS = 12 * 60 * 1000;
const MIN_MOVE_KM = 5;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface MapWeather {
  mode: WeatherMode;
  tempC: number;
  windSpeedKmh: number;
  weatherCode: number;
  fetchedAt: number;
}

export function useMapWeather(center: { lat: number; lng: number } | null, forceMode?: WeatherMode) {
  const [weather, setWeather] = useState<MapWeather | null>(null);
  const lastFetchRef = useRef<{ lat: number; lng: number; at: number } | null>(null);

  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    try {
      const url = `${OPEN_METEO}?latitude=${lat}&longitude=${lng}&current=weather_code,temperature_2m,wind_speed_10m`;
      const res = await fetch(url);
      const data = (await res.json()) as { current?: { weather_code?: number; temperature_2m?: number; wind_speed_10m?: number } };
      const cur = data?.current;
      const code = cur?.weather_code ?? 0;
      setWeather({
        mode: weatherCodeToMode(code),
        tempC: cur?.temperature_2m ?? 0,
        windSpeedKmh: cur?.wind_speed_10m ?? 0,
        weatherCode: code,
        fetchedAt: Date.now(),
      });
      lastFetchRef.current = { lat, lng, at: Date.now() };
    } catch {
      setWeather((w) => w ?? { mode: 'CLOUDY', tempC: 0, windSpeedKmh: 0, weatherCode: 0, fetchedAt: 0 });
    }
  }, []);

  const maybeRefresh = useCallback(
    (lat: number, lng: number) => {
      if (forceMode !== undefined) {
        setWeather((w) => ({
          mode: forceMode,
          tempC: w?.tempC ?? 0,
          windSpeedKmh: w?.windSpeedKmh ?? 0,
          weatherCode: w?.weatherCode ?? 0,
          fetchedAt: Date.now(),
        }));
        return;
      }
      const last = lastFetchRef.current;
      const now = Date.now();
      if (!last) {
        fetchWeather(lat, lng);
        return;
      }
      const distKm = haversineKm(last.lat, last.lng, lat, lng);
      if (distKm >= MIN_MOVE_KM || now - last.at >= REFRESH_DEBOUNCE_MS) {
        fetchWeather(lat, lng);
      }
    },
    [forceMode, fetchWeather]
  );

  const effectiveMode = forceMode ?? weather?.mode ?? 'CLOUDY';

  return { weather, effectiveMode, maybeRefresh, fetchWeather };
}

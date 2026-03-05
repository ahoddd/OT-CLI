/**
 * WeatherMode — derived from real weather at map center.
 * Drives map visuals (e.g. snow overlay only when SNOW).
 */

export type WeatherMode = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'FOG' | 'WINDY';

export function weatherCodeToMode(code: number): WeatherMode {
  if (code === 0) return 'CLEAR';
  if (code >= 1 && code <= 3) return 'CLOUDY';
  if (code >= 51 && code <= 67) return 'RAIN';
  if (code >= 71 && code <= 77) return 'SNOW';
  if (code >= 80 && code <= 82) return 'RAIN';
  if (code >= 85 && code <= 86) return 'SNOW';
  if (code >= 95 && code <= 99) return 'RAIN';
  if (code === 45 || code === 48) return 'FOG';
  return 'CLOUDY';
}

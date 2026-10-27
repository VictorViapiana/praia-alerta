"use client";

import { useEffect, useState } from "react";

const LAT = -20.671;
const LON = -40.497;

export type DayForecast = {
  date: string;
  label: string;
  code: number;
  max: number;
  min: number;
  uv: number;
  rain: number;
  wind: number;
  summary: string;
  mark: string;
};

export type WeatherNow = {
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  windDir: string;
  uv: number;
  code: number;
  summary: string;
  days: DayForecast[];
};

export type TidePoint = { time: string; label: string; level: number };

export type TideNow = {
  level: number;
  wave: number;
  trend: "Enchente" | "Vazante" | "Estável";
  note: string;
  nextHigh: TidePoint | null;
  nextLow: TidePoint | null;
  series: TidePoint[];
  cursor: number;
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function meters(value: number) {
  return `${value.toFixed(2).replace(".", ",")} m`;
}

export function weatherText(code: number) {
  if (code === 0) return "Céu limpo";
  if (code <= 3) return "Parcialmente nublado";
  if (code === 45 || code === 48) return "Neblina";
  if (code <= 55) return "Garoa";
  if (code <= 67) return "Chuva";
  if (code <= 77) return "Neve";
  if (code <= 82) return "Pancadas";
  if (code >= 95) return "Trovoada";
  return "Instável";
}

export function weatherMark(code: number) {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 95) return "⛈️";
  if (code >= 51) return "🌧️";
  return "☁️";
}

export function uvLabel(uv: number) {
  if (uv < 3) return "baixo";
  if (uv < 6) return "moderado";
  if (uv < 8) return "alto";
  if (uv < 11) return "muito alto";
  return "extremo";
}

function cardinal(deg: number) {
  const dirs = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

function dayLabel(iso: string, index: number) {
  if (index === 0) return "Hoje";
  if (index === 1) return "Amanhã";
  const date = new Date(`${iso}T12:00:00`);
  return WEEKDAYS[date.getDay()];
}

function hourLabel(iso: string) {
  return `${iso.slice(11, 13)}h`;
}

type ForecastJson = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    uv_index: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    uv_index_max: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
};

type MarineJson = {
  hourly: {
    time: string[];
    sea_level_height_msl: number[];
    wave_height: number[];
  };
};

function parseWeather(json: ForecastJson): WeatherNow {
  const code = json.current.weather_code;
  return {
    temp: json.current.temperature_2m,
    feels: json.current.apparent_temperature,
    humidity: json.current.relative_humidity_2m,
    wind: json.current.wind_speed_10m,
    windDir: cardinal(json.current.wind_direction_10m),
    uv: json.current.uv_index,
    code,
    summary: weatherText(code),
    days: json.daily.time.map((date, index) => {
      const dayCode = json.daily.weather_code[index];
      return {
        date,
        label: dayLabel(date, index),
        code: dayCode,
        max: json.daily.temperature_2m_max[index],
        min: json.daily.temperature_2m_min[index],
        uv: json.daily.uv_index_max[index],
        rain: json.daily.precipitation_probability_max[index],
        wind: json.daily.wind_speed_10m_max[index],
        summary: weatherText(dayCode),
        mark: weatherMark(dayCode),
      };
    }),
  };
}

function parseTide(json: MarineJson): TideNow | null {
  const times = json.hourly.time;
  const levels = json.hourly.sea_level_height_msl;
  const waves = json.hourly.wave_height;
  if (!times?.length || levels.length !== times.length) return null;

  const now = Date.now();
  let cursor = 0;
  let best = Number.POSITIVE_INFINITY;
  times.forEach((iso, index) => {
    const delta = Math.abs(new Date(iso).getTime() - now);
    if (delta < best) {
      best = delta;
      cursor = index;
    }
  });

  const level = levels[cursor];
  const previous = levels[Math.max(0, cursor - 1)];
  const delta = level - previous;
  const trend = delta > 0.03 ? "Enchente" : delta < -0.03 ? "Vazante" : "Estável";

  const highs: TidePoint[] = [];
  const lows: TidePoint[] = [];
  for (let index = 1; index < levels.length - 1; index += 1) {
    const point = { time: times[index], label: hourLabel(times[index]), level: levels[index] };
    if (levels[index] >= levels[index - 1] && levels[index] > levels[index + 1]) highs.push(point);
    if (levels[index] <= levels[index - 1] && levels[index] < levels[index + 1]) lows.push(point);
  }

  const upcoming = (points: TidePoint[]) =>
    points.find((point) => new Date(point.time).getTime() > now) ?? null;

  const end = Math.min(levels.length, cursor + 19);
  const series = times.slice(cursor, end).map((time, index) => ({
    time,
    label: hourLabel(time),
    level: levels[cursor + index],
  }));

  const wave = waves[cursor] ?? 0;
  const note =
    wave < 0.6
      ? "Ondas baixas. Banho mais confortável entre os postos."
      : wave < 1.2
        ? "Ondas moderadas. Atenção no raso e nas crianças."
        : "Ondas altas. Prefira a areia se a bandeira apertar.";

  return {
    level,
    wave,
    trend,
    note,
    nextHigh: upcoming(highs),
    nextLow: upcoming(lows),
    series,
    cursor: 0,
  };
}

let weatherPromise: Promise<WeatherNow | null> | null = null;
let tidePromise: Promise<TideNow | null> | null = null;

export function loadWeather() {
  weatherPromise ??= fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,wind_speed_10m_max&timezone=America/Sao_Paulo&forecast_days=7`,
  )
    .then((response) => {
      if (!response.ok) throw new Error("clima");
      return response.json() as Promise<ForecastJson>;
    })
    .then(parseWeather)
    .catch(() => null);
  return weatherPromise;
}

export function loadTide() {
  tidePromise ??= fetch(
    `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}&hourly=sea_level_height_msl,wave_height&timezone=America/Sao_Paulo&forecast_days=2`,
  )
    .then((response) => {
      if (!response.ok) throw new Error("mare");
      return response.json() as Promise<MarineJson>;
    })
    .then(parseTide)
    .catch(() => null);
  return tidePromise;
}

export function useWeather() {
  const [data, setData] = useState<WeatherNow | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadWeather().then((value) => {
      if (!alive) return;
      if (!value) setFailed(true);
      else setData(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { data, failed };
}

export function useTide() {
  const [data, setData] = useState<TideNow | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadTide().then((value) => {
      if (!alive) return;
      if (!value) setFailed(true);
      else setData(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { data, failed };
}

function tideFrame(series: TidePoint[]) {
  const levels = series.map((point) => point.level);
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  return { min, span: Math.max(0.2, max - min) };
}

export function tidePath(series: TidePoint[]) {
  if (series.length < 2) return "";
  const { min, span } = tideFrame(series);
  return series
    .map((point, index) => {
      const x = (index / (series.length - 1)) * 320;
      const y = 10 + (1 - (point.level - min) / span) * 68;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function tideDot(series: TidePoint[]) {
  if (!series.length) return { x: 4, y: 46 };
  const { min, span } = tideFrame(series);
  return { x: 4, y: 10 + (1 - (series[0].level - min) / span) * 68 };
}

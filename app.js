const DEFAULT = { name: "Boca Raton", lat: 26.3683, lon: -80.1289 };

const CODES = {
  0: ["Clear", "☀️", "🌙"],
  1: ["Mostly Clear", "🌤️", "🌙"],
  2: ["Partly Cloudy", "⛅", "☁️"],
  3: ["Cloudy", "☁️", "☁️"],
  45: ["Fog", "🌫️"], 48: ["Fog", "🌫️"],
  51: ["Drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Drizzle", "🌧️"],
  56: ["Freezing Drizzle", "🌧️"], 57: ["Freezing Drizzle", "🌧️"],
  61: ["Light Rain", "🌦️"], 63: ["Rain", "🌧️"], 65: ["Heavy Rain", "🌧️"],
  66: ["Freezing Rain", "🌧️"], 67: ["Freezing Rain", "🌧️"],
  71: ["Light Snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy Snow", "❄️"], 77: ["Snow Grains", "🌨️"],
  80: ["Showers", "🌦️"], 81: ["Showers", "🌧️"], 82: ["Heavy Showers", "⛈️"],
  85: ["Snow Showers", "🌨️"], 86: ["Snow Showers", "❄️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm", "⛈️"], 99: ["Thunderstorm", "⛈️"],
};

const $ = (id) => document.getElementById(id);

function describe(code, isDay = 1) {
  const [label, day, night] = CODES[code] || ["Unknown", "🌡️"];
  return { label, icon: isDay ? day : night || day };
}

async function loadWeather({ name, lat, lon }) {
  $("city").textContent = name;
  $("desc").textContent = "Loading…";

  const url = "https://api.open-meteo.com/v1/forecast?" + new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    hourly: "temperature_2m,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
    forecast_days: 7,
  });

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    render(await res.json());
  } catch {
    $("desc").textContent = "Couldn't load weather";
  }
}

// Weather code -> background scene
function scene(code) {
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 51) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code >= 2) return "cloudy";
  return "clear";
}

function render(data) {
  const { current: c, hourly: h, daily: d } = data;
  const now = describe(c.weather_code, c.is_day);

  const bg = document.querySelector(".bg");
  bg.dataset.sky = `${scene(c.weather_code)}-${c.is_day ? "day" : "night"}`;
  bg.dataset.temp = c.temperature_2m >= 85 ? "hot" : c.temperature_2m <= 45 ? "cold" : "mild";

  $("temp").textContent = `${Math.round(c.temperature_2m)}°`;
  $("desc").textContent = now.label;
  $("hilo").textContent = `H:${Math.round(d.temperature_2m_max[0])}°  L:${Math.round(d.temperature_2m_min[0])}°`;
  $("feels").textContent = `${Math.round(c.apparent_temperature)}°`;
  $("humidity").textContent = `${c.relative_humidity_2m}%`;
  $("wind").textContent = `${Math.round(c.wind_speed_10m)} mph`;
  $("uv").textContent = Math.round(d.uv_index_max[0]);

  // Next 24 hours starting from the current hour
  const start = h.time.findIndex((t) => t >= c.time.slice(0, 13));
  $("hourly").innerHTML = h.time.slice(start, start + 24).map((t, i) => {
    const j = start + i;
    const label = i === 0 ? "Now" : new Date(t).toLocaleTimeString([], { hour: "numeric" });
    return `<div class="hour">
      <span>${label}</span>
      <span class="icon">${describe(h.weather_code[j], h.is_day[j]).icon}</span>
      <span>${Math.round(h.temperature_2m[j])}°</span>
    </div>`;
  }).join("");

  // Tomorrow and the day after, in more detail
  const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  $("twoday").innerHTML = [1, 2].map((i) => {
    const w = describe(d.weather_code[i]);
    const name = i === 1 ? "Tomorrow" : new Date(d.time[i] + "T00:00").toLocaleDateString([], { weekday: "long" });
    return `<div class="card">
      <span class="name">${name}</span>
      <span class="icon">${w.icon}</span>
      <span>${w.label}</span>
      <span class="hl">${Math.round(d.temperature_2m_max[i])}° <span>/ ${Math.round(d.temperature_2m_min[i])}°</span></span>
      <span class="meta">💧 ${d.precipitation_probability_max[i] ?? 0}% rain</span>
      <span class="meta">💨 ${Math.round(d.wind_speed_10m_max[i])} mph</span>
      <span class="meta">🌅 ${time(d.sunrise[i])}</span>
      <span class="meta">🌇 ${time(d.sunset[i])}</span>
    </div>`;
  }).join("");

  const min = Math.min(...d.temperature_2m_min);
  const span = Math.max(...d.temperature_2m_max) - min || 1;
  $("daily").innerHTML = d.time.map((t, i) => {
    const lo = d.temperature_2m_min[i];
    const hi = d.temperature_2m_max[i];
    const day = i === 0 ? "Today" : new Date(t + "T00:00").toLocaleDateString([], { weekday: "short" });
    return `<div class="day">
      <span>${day}</span>
      <span class="icon">${describe(d.weather_code[i]).icon}</span>
      <div class="range">
        <span class="lo">${Math.round(lo)}°</span>
        <div class="bar"><span style="left:${((lo - min) / span) * 100}%;right:${100 - ((hi - min) / span) * 100}%"></span></div>
        <span class="hi">${Math.round(hi)}°</span>
      </div>
    </div>`;
  }).join("");
}

$("search").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = $("query").value.trim();
  if (!q) return;

  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`);
  const place = (await res.json()).results?.[0];
  if (!place) {
    $("desc").textContent = "City not found";
    return;
  }
  $("query").value = "";
  $("query").blur();
  loadWeather({ name: place.name, lat: place.latitude, lon: place.longitude });
});

function greet() {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  $("greeting").textContent = `${part}, Jerry`;
}

function setTheme(theme) {
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  document.querySelectorAll(".theme button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.theme === theme));
  try { localStorage.setItem("theme", theme); } catch {}
}

document.querySelectorAll(".theme button").forEach((b) => b.addEventListener("click", () => setTheme(b.dataset.theme)));

let savedTheme = "system";
try { savedTheme = localStorage.getItem("theme") || "system"; } catch {}
setTheme(savedTheme);
greet();
loadWeather(DEFAULT);

// ✅ Firebase + Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCUV-8E2w3Td_TyYo52LAvhb2WA9CnVaLY",
  authDomain: "trial-quest-45442.firebaseapp.com",
  projectId: "trial-quest-45442",
  storageBucket: "trail-quest-45442.appspot.com",
  messagingSenderId: "780796401639",
  appId: "1:780796401639:web:b3bfb178ff7450ac3c0f42"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ OpenWeather API Key
const OPENWEATHER_API_KEY = "2d3072b51b8779c0aac422c13f14e080";

// 🌤️ Elements
const cityNameElem = document.getElementById("cityName");
const dayTabsContainer = document.querySelector(".weather-day-tabs");
const hourlyContainer = document.getElementById("hourlyForecast");
const precipContainer = document.getElementById("precipitationForecast");
const mapLink = document.getElementById("mapLink");

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("tripId");
  const organizerId = urlParams.get("organizerId");

  if (!tripId || !organizerId) return;

  try {
    const tripRef = doc(db, "trips", organizerId, "tripList", tripId);
    const tripSnap = await getDoc(tripRef);
    if (!tripSnap.exists()) return;

    const tripData = tripSnap.data();
    const trailName = tripData.tripName;
    const cityPlace = tripData.cityPlace;
    cityNameElem.textContent = trailName;

    await fetchWeatherData(cityPlace);
    await loadMap(trailName);
  } catch (err) {
    console.error("Failed to load trip/weather/map:", err);
  }
});

// 🌐 Weather
async function fetchWeatherData(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.cod !== "200") throw new Error("Invalid forecast");

    const forecastByDay = groupForecastByDay(data.list);
    renderDayTabs(Object.keys(forecastByDay), forecastByDay);
  } catch (err) {
    console.error("Weather API error:", err);
  }
}

function groupForecastByDay(list) {
  const grouped = {};
  list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString("en-US", { weekday: "long" });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(item);
  });
  return grouped;
}

function getWeatherIconClass(main) {
  switch (main.toLowerCase()) {
    case "clear": return "fas fa-sun";
    case "clouds": return "fas fa-cloud";
    case "rain":
    case "drizzle": return "fas fa-cloud-showers-heavy";
    case "thunderstorm": return "fas fa-bolt";
    case "snow": return "fas fa-snowflake";
    case "mist":
    case "fog":
    case "haze": return "fas fa-smog";
    default: return "fas fa-cloud";
  }
}

function renderDayTabs(days, forecastByDay) {
  dayTabsContainer.innerHTML = "";
  const filteredDays = days.filter(day => forecastByDay[day].length >= 5);

  filteredDays.forEach((day, idx) => {
    const btn = document.createElement("button");
    btn.className = "day-tab" + (idx === 0 ? " active" : "");
    btn.textContent = idx === 0 ? "Today" : day;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".day-tab").forEach(tab => tab.classList.remove("active"));
      btn.classList.add("active");
      const selected = forecastByDay[day].slice(0, 5);
      renderHourlyForecast(selected);
      renderPrecipitationForecast(selected);
    });

    dayTabsContainer.appendChild(btn);
  });

  if (filteredDays.length > 0) {
    const selected = forecastByDay[filteredDays[0]].slice(0, 5);
    renderHourlyForecast(selected);
    renderPrecipitationForecast(selected);
  }
}

function renderHourlyForecast(data) {
  hourlyContainer.innerHTML = "";
  data.forEach(entry => {
    const time = new Date(entry.dt * 1000).toLocaleTimeString("en-US", { hour: "numeric" });
    const temp = Math.round(entry.main.temp);
    const mainCondition = entry.weather[0].main;
    const iconClass = getWeatherIconClass(mainCondition);

    const div = document.createElement("div");
    div.className = "forecast-item";
    div.innerHTML = `
      <div class="time">${time}</div>
      <div class="weather-icon"><i class="${iconClass}"></i></div>
      <div class="temp">${temp}°</div>
    `;
    hourlyContainer.appendChild(div);
  });
}

function renderPrecipitationForecast(data) {
  precipContainer.innerHTML = "";

  const iconsRow = document.createElement("div");
  iconsRow.className = "precip-row icons";

  const percentRow = document.createElement("div");
  percentRow.className = "precip-row percentages";

  const timeRow = document.createElement("div");
  timeRow.className = "precip-row times";

  data.forEach(entry => {
    const time = new Date(entry.dt * 1000).toLocaleTimeString("en-US", { hour: "numeric" });
    const pop = Math.round((entry.pop || 0) * 100);
    const mainCondition = entry.weather[0].main;
    const iconClass = getWeatherIconClass(mainCondition);

    iconsRow.innerHTML += `<i class="${iconClass}"></i>`;
    percentRow.innerHTML += `<span>${pop}%</span>`;
    timeRow.innerHTML += `<span>${time}</span>`;
  });

  precipContainer.appendChild(iconsRow);
  precipContainer.appendChild(percentRow);
  precipContainer.appendChild(timeRow);
}

// 🗺️ MAP
async function loadMap(trailName) {
  try {
    const coords = await getLatLngFromCity(trailName);

    const map = L.map('map').setView([coords.lat, coords.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([coords.lat, coords.lng]).addTo(map)
      .bindPopup(`<b>${trailName}</b>`)
      .openPopup();

    if (mapLink) {
      mapLink.href = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    }
  } catch (err) {
    console.error("Map load error:", err);
    document.getElementById('map').innerText = 'Map failed: ' + err.message;
  }
}

// ✅ Get lat/lng using proxy
async function getLatLngFromCity(cityOrPlace) {
  const encodedPlace = encodeURIComponent(cityOrPlace);
  const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodedPlace}&limit=1`
  )}`;

  const response = await fetch(allOriginsUrl);
  const data = await response.json();

  if (!data || !data[0]) {
    throw new Error("Location not found");
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

// PWA: Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered:", reg.scope))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  });
}

// Initial JS setup for Weather App
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const recentCities = document.getElementById("recentCities");
const errorMsg = document.getElementById("errorMsg");

const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const unitToggle = document.getElementById("unitToggle");
const alertMsg = document.getElementById("alert");
const forecastDiv = document.getElementById("forecast");
const weatherBox = document.getElementById("weatherBox");
const body = document.getElementById("body");

let isCelsius = true;
let todayTemp = 0;

// ================= SEARCH =================
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) return showError("Please enter a city name");
  fetchCityCoords(city);
});

// ================= LOCATION =================
locationBtn.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
    () => showError("Location access denied")
  );
});

// ================= CITY → COORDS =================
async function fetchCityCoords(city) {
  try {
    clearError();
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
    );
    const data = await res.json();
    if (!data.results) throw new Error("City not found");

    const { latitude, longitude, name } = data.results[0];
    saveCity(name);
    fetchWeather(latitude, longitude, name);
  } catch (err) {
    showError(err.message);
  }
}

// // Fetch weather using user current location
async function fetchWeather(lat, lon, name = "") {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,wind_speed_10m_max,relative_humidity_2m_max&timezone=auto`
  );
  const data = await res.json();
  displayCurrent(data, name);
  displayForecast(data);
}

// ================= DISPLAY =================
function displayCurrent(data, name) {
  weatherBox.classList.remove("hidden");

  cityName.textContent = name;
  todayTemp = data.current.temperature_2m;
  temperature.textContent = `${todayTemp} °C`;
  humidity.textContent = data.current.relative_humidity_2m;
  wind.textContent = data.current.wind_speed_10m;
  condition.textContent = weatherText(data.current.weather_code);

  if (todayTemp > 40) {
    alertMsg.textContent = "⚠ Extreme Heat Alert!";
    alertMsg.classList.remove("hidden");
  } else {
    alertMsg.classList.add("hidden");
  }

  setBackground(data.current.weather_code);
}

// ================= FORECAST =================
function displayForecast(data) {
  forecastDiv.innerHTML = "";
  data.daily.temperature_2m_max.slice(0, 5).forEach((temp, i) => {
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <p>Day ${i + 1}</p>
      <p>🌡 ${temp} °C</p>
      <p>💧 ${data.daily.relative_humidity_2m_max[i]}%</p>
      <p>💨 ${data.daily.wind_speed_10m_max[i]} km/h</p>
    `;
    forecastDiv.appendChild(card);
  });
}

// ================= TOGGLE =================
unitToggle.addEventListener("click", () => {
  isCelsius = !isCelsius;
  temperature.textContent = isCelsius
    ? `${todayTemp} °C`
    : `${(todayTemp * 9/5 + 32).toFixed(1)} °F`;
  unitToggle.textContent = isCelsius ? "°F" : "°C";
});

// ================= STORAGE =================
function saveCity(city) {
  let cities = JSON.parse(localStorage.getItem("cities")) || [];
  if (!cities.includes(city)) {
    cities.push(city);
    localStorage.setItem("cities", JSON.stringify(cities));
  }
  loadCities();
}

function loadCities() {
  const cities = JSON.parse(localStorage.getItem("cities")) || [];
  if (!cities.length) return;

  recentCities.classList.remove("hidden");
  recentCities.innerHTML = `<option>Select recent city</option>`;
  cities.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    recentCities.appendChild(opt);
  });
}

recentCities.addEventListener("change", e => {
  fetchCityCoords(e.target.value);
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function clearError() {
  errorMsg.classList.add("hidden");
}

function weatherText(code) {
  if (code === 0) return "Clear Sky ☀️";
  if (code < 3) return "Cloudy ☁️";
  if (code < 70) return "Rainy 🌧";
  return "Stormy ⛈";
}

function setBackground(code) {
  body.className = "";
  body.classList.add(code < 3 ? "sunny" : code < 70 ? "rainy" : "stormy");
}

loadCities();

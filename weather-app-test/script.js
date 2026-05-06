// ===== API Configuration =====
// Sign up for free at: https://www.weatherapi.com/
// Get your API key from your dashboard
const API_KEY = 'c59904b40c004ce7984220159260605'; // the actual API key from weatherapi.com
const API_BASE_URL = 'https://api.weatherapi.com/v1/forecast.json';

// ===== DOM Elements =====
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const errorContainer = document.getElementById('errorContainer');
const loadingContainer = document.getElementById('loadingContainer');
const loadingText = document.getElementById('loadingText');
const currentWeatherContainer = document.getElementById('currentWeatherContainer');
const currentWeather = document.getElementById('currentWeather');
const forecastContainer = document.getElementById('forecastContainer');
const forecastGrid = document.getElementById('forecastGrid');
const unitSelect = document.getElementById('unitSelect');
const lastSearchInfo = document.getElementById('lastSearchInfo');

// ===== State Variables =====
let currentWeatherData = null;
let forecastData = null;
let isCelsius = true;

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    loadPreferences();
    const lastCity = localStorage.getItem('lastSearchedCity');
    if (lastCity) {
        cityInput.value = lastCity;
        updateLastSearchInfo(lastCity);
    }
});

// ===== Event Listeners =====
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

unitSelect.addEventListener('change', (e) => {
    isCelsius = e.target.value === 'celsius';
    localStorage.setItem('tempUnit', isCelsius ? 'celsius' : 'fahrenheit');
    if (currentWeatherData && forecastData) {
        displayCurrentWeather(currentWeatherData);
        displayForecast(forecastData);
    }
});

// ===== Main Functions =====
async function handleSearch() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    if (API_KEY === 'YOUR_API_KEY') {
        showError('API Key not configured. Please add your WeatherAPI.com key to script.js');
        return;
    }

    clearError();
    showLoading(`Fetching weather for ${city}...`);
    
    try {
        const data = await fetchWeather(city);
        currentWeatherData = data;
        forecastData = data.forecast.forecastday;
        
        displayCurrentWeather(data);
        displayForecast(data.forecast.forecastday);
        
        // Save last searched city
        localStorage.setItem('lastSearchedCity', city);
        updateLastSearchInfo(city);
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

async function fetchWeather(city) {
    try {
        const params = new URLSearchParams({
            key: API_KEY,
            q: city,
            days: 5,
            aqi: 'no'
        });

        const response = await fetch(`${API_BASE_URL}?${params}`);

        if (!response.ok) {
            if (response.status === 400) {
                throw new Error('City not found. Please try another city name.');
            } else if (response.status === 403) {
                throw new Error('API key is invalid. Please check your configuration.');
            } else {
                throw new Error(`Weather API error: ${response.statusText}`);
            }
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error('Network error. Please check your internet connection.');
        }
        throw error;
    }
}

function displayCurrentWeather(data) {
    const current = data.current;
    const location = data.location;
    
    const temp = isCelsius ? current.temp_c : current.temp_f;
    const feelsLike = isCelsius ? current.feelslike_c : current.feelslike_f;
    const tempUnit = isCelsius ? '°C' : '°F';
    
    const html = `
        <div class="weather-city">${location.name}, ${location.country}</div>
        <div class="weather-icon-large">${getWeatherEmoji(current.condition.code, current.is_day)}</div>
        <div class="weather-temp">${Math.round(temp)}${tempUnit}</div>
        <div class="weather-condition">${current.condition.text}</div>
        <div class="weather-details">
            <div class="detail">
                <span class="detail-label">Feels Like</span>
                <span class="detail-value">${Math.round(feelsLike)}${tempUnit}</span>
            </div>
            <div class="detail">
                <span class="detail-label">Humidity</span>
                <span class="detail-value">${current.humidity}%</span>
            </div>
            <div class="detail">
                <span class="detail-label">Wind</span>
                <span class="detail-value">${Math.round(current.wind_kph)} km/h</span>
            </div>
        </div>
    `;
    
    currentWeather.innerHTML = html;
    currentWeatherContainer.classList.add('show');
}

function displayForecast(forecastDays) {
    forecastGrid.innerHTML = '';
    
    forecastDays.slice(0, 5).forEach((day) => {
        const maxTemp = isCelsius ? day.day.maxtemp_c : day.day.maxtemp_f;
        const minTemp = isCelsius ? day.day.mintemp_c : day.day.mintemp_f;
        const tempUnit = isCelsius ? '°C' : '°F';
        
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        const dayCard = document.createElement('div');
        dayCard.className = 'forecast-day';
        dayCard.innerHTML = `
            <div class="forecast-date">${dayName}</div>
            <div class="forecast-icon">${getWeatherEmoji(day.day.condition.code, true)}</div>
            <div class="forecast-condition">${day.day.condition.text}</div>
            <div class="forecast-temps">
                <span class="forecast-temp-high">${Math.round(maxTemp)}${tempUnit}</span>
                <span class="forecast-temp-low">${Math.round(minTemp)}${tempUnit}</span>
            </div>
        `;
        
        forecastGrid.appendChild(dayCard);
    });
    
    forecastContainer.classList.add('show');
}

// ===== Utility Functions =====
function getWeatherEmoji(weatherCode, isDay) {
    // Weather code reference from WeatherAPI.com
    // Clear sky
    if (weatherCode === 1000) return isDay ? '☀️' : '🌙';
    // Partly cloudy
    if (weatherCode === 1003) return isDay ? '⛅' : '🌤️';
    // Overcast
    if (weatherCode === 1006) return '☁️';
    // Mist/Fog
    if (weatherCode === 1009 || weatherCode === 1030 || weatherCode === 1135 || weatherCode === 1147) return '🌫️';
    // Patchy rain/drizzle
    if (weatherCode === 1012 || weatherCode === 1015 || weatherCode === 1018 || weatherCode === 1021 || 
        weatherCode === 1045 || weatherCode === 1063 || weatherCode === 1069 || weatherCode === 1072) return '🌦️';
    // Light rain
    if (weatherCode === 1150 || weatherCode === 1153 || weatherCode === 1168 || weatherCode === 1171 || 
        weatherCode === 1180 || weatherCode === 1183) return '🌧️';
    // Moderate/heavy rain
    if (weatherCode === 1186 || weatherCode === 1189 || weatherCode === 1192 || weatherCode === 1195 || 
        weatherCode === 1198 || weatherCode === 1201 || weatherCode === 1240 || weatherCode === 1243 || weatherCode === 1246) return '⛈️';
    // Sleet
    if (weatherCode === 1204 || weatherCode === 1207 || weatherCode === 1249 || weatherCode === 1252) return '🌨️';
    // Snow
    if (weatherCode === 1210 || weatherCode === 1213 || weatherCode === 1216 || weatherCode === 1219 || 
        weatherCode === 1222 || weatherCode === 1225 || weatherCode === 1255 || weatherCode === 1258) return '❄️';
    // Hail
    if (weatherCode === 1237 || weatherCode === 1261 || weatherCode === 1264) return '🧊';
    // Thunderstorm
    if (weatherCode === 1273 || weatherCode === 1276 || weatherCode === 1279 || weatherCode === 1282) return '⚡';
    // Default
    return '🌤️';
}

function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.add('show');
}

function clearError() {
    errorContainer.classList.remove('show');
    errorContainer.textContent = '';
}

function showLoading(message) {
    loadingText.textContent = message;
    loadingContainer.classList.add('show');
}

function hideLoading() {
    loadingContainer.classList.remove('show');
    loadingText.textContent = '';
}

function updateLastSearchInfo(city) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    lastSearchInfo.textContent = `Last search: ${city} at ${timeString}`;
}

function loadPreferences() {
    const savedUnit = localStorage.getItem('tempUnit');
    if (savedUnit === 'fahrenheit') {
        isCelsius = false;
        unitSelect.value = 'fahrenheit';
    } else {
        isCelsius = true;
        unitSelect.value = 'celsius';
    }
}

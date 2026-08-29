/**
 * ========================================
 * MAIN APP CONTROLLER
 * ========================================
 * Orchestrates API calls and UI updates.
 * Handles user interactions: search, geolocation, and keyboard events.
 */

import { fetchWeatherByCity, fetchWeatherByCoords, fetchForecastByCity, fetchForecastByCoords } from './api.js';
import { showLoading, hideLoading, showWeather, showForecast, showError, hideError, resetUI } from './ui.js';

// --- DOM references ---
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const geoBtn = document.getElementById('geo-btn');

// --- State ---
let currentCity = '';

/**
 * ========================================
 * SEARCH BY CITY NAME
 * ========================================
 */
async function handleSearch(city) {
    if (!city || city.trim() === '') {
        showError('Please enter a city name.');
        return;
    }

    // Reset UI to loading state and hide any previous error
    resetUI();
    hideError();

    try {
        // Fetch current weather and 5‑day forecast in parallel
        const [weatherData, forecastData] = await Promise.all([
            fetchWeatherByCity(city),
            fetchForecastByCity(city)
        ]);

        // Populate the UI
        showWeather(weatherData);
        showForecast(forecastData);

        // Save the city for later (e.g., refresh)
        currentCity = city;

        // Optionally clear the input after successful search
        // searchInput.value = '';
    } catch (error) {
        // Display the error message (from API or network)
        showError(error.message || 'Failed to fetch weather data.');

        // Hide the loading spinner and ensure weather data is hidden
        hideLoading();
        document.getElementById('weather-data').classList.add('hidden');
        // Forecast container will show its placeholder (resetUI already did that)
    }
}

/**
 * ========================================
 * SEARCH BY GEOLOCATION
 * ========================================
 */
async function handleGeolocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        return;
    }

    // Reset UI and hide previous errors
    resetUI();
    hideError();

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                // Fetch weather and forecast using coordinates
                const [weatherData, forecastData] = await Promise.all([
                    fetchWeatherByCoords(latitude, longitude),
                    fetchForecastByCoords(latitude, longitude)
                ]);

                showWeather(weatherData);
                showForecast(forecastData);
                currentCity = weatherData.city;
            } catch (error) {
                showError(error.message || 'Failed to fetch weather for your location.');
                hideLoading();
                document.getElementById('weather-data').classList.add('hidden');
            }
        },
        (error) => {
            // Handle geolocation permission errors
            let msg = 'Unable to retrieve your location. ';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    msg += 'Please allow location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    msg += 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    msg += 'The request timed out.';
                    break;
                default:
                    msg += 'Unknown error.';
            }
            showError(msg);
            hideLoading();
            document.getElementById('weather-data').classList.add('hidden');
        }
    );
}

// ========================================
// EVENT LISTENERS
// ========================================

// --- Search button ---
searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    handleSearch(city);
});

// --- Enter key on input ---
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const city = searchInput.value.trim();
        handleSearch(city);
    }
});

// --- Geolocation button ---
geoBtn.addEventListener('click', handleGeolocation);

// ========================================
// OPTIONAL: LOAD DEFAULT CITY ON START
// ========================================
// Uncomment the line below to automatically show weather for London on page load.
// window.addEventListener('load', () => {
//     handleSearch('London');
// });
/**
 * ========================================
 * UI CONTROLLER
 * ========================================
 * Manages all DOM updates for the weather app.
 * Caches DOM elements for performance and provides
 * a clean API for the main app.
 */

// --- Cache DOM elements ---
const elements = {
    // Loading
    loadingState: document.getElementById('loading-state'),
    weatherData: document.getElementById('weather-data'),

    // Weather main
    cityName: document.getElementById('city-name'),
    countryName: document.getElementById('country-name'),
    weatherIcon: document.getElementById('weather-icon'),
    tempValue: document.getElementById('temp-value'),
    weatherCondition: document.getElementById('weather-condition'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    feelsLike: document.getElementById('feels-like'),
    lastUpdated: document.getElementById('last-updated'),

    // Forecast
    forecastContainer: document.getElementById('forecast-container'),
    forecastPlaceholder: document.querySelector('.forecast-placeholder'),

    // Error
    errorMsg: document.getElementById('error-msg'),
    errorText: document.querySelector('#error-msg p'),
};

/**
 * ========================================
 * LOADING STATE
 * ========================================
 */
export function showLoading() {
    elements.loadingState.classList.remove('hidden');
    elements.weatherData.classList.add('hidden');
}

export function hideLoading() {
    elements.loadingState.classList.add('hidden');
    elements.weatherData.classList.remove('hidden');
}

/**
 * ========================================
 * WEATHER DATA DISPLAY
 * ========================================
 * @param {object} data - Parsed weather data from api.js
 */
export function showWeather(data) {
    // Hide loading, show data
    hideLoading();

    // Populate fields
    elements.cityName.textContent = data.city;
    elements.countryName.textContent = data.country;
    elements.weatherIcon.src = data.iconUrl;
    elements.weatherIcon.alt = data.condition;
    elements.tempValue.textContent = data.temp;
    elements.weatherCondition.textContent = data.condition;
    elements.humidity.textContent = `${data.humidity}%`;
    elements.windSpeed.textContent = `${data.windSpeed} km/h`;
    elements.feelsLike.textContent = `${data.feelsLike}°C`;

    // Update timestamp
    const timeStr = data.timestamp.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
    elements.lastUpdated.textContent = `Last updated: ${timeStr}`;

    // Ensure weather data is visible
    elements.weatherData.classList.remove('hidden');
}

/**
 * ========================================
 * FORECAST DISPLAY
 * ========================================
 * @param {Array} forecast - Array of daily forecast objects
 */
export function showForecast(forecast) {
    // Clear container (keep placeholder as fallback)
    const container = elements.forecastContainer;
    container.innerHTML = '';

    if (!forecast || forecast.length === 0) {
        container.innerHTML = `<p class="forecast-placeholder">No forecast data available.</p>`;
        return;
    }

    // Build forecast cards
    forecast.forEach((day) => {
        const card = document.createElement('div');
        card.className = 'forecast-card';

        // Day name
        const dayName = document.createElement('p');
        dayName.className = 'day';
        dayName.textContent = day.dayName;
        card.appendChild(dayName);

        // Icon
        const icon = document.createElement('img');
        icon.className = 'forecast-icon';
        icon.src = day.iconUrl;
        icon.alt = day.condition;
        card.appendChild(icon);

        // Temperature
        const temp = document.createElement('p');
        temp.className = 'forecast-temp';
        temp.innerHTML = `${day.temp}°<small>C</small>`;
        card.appendChild(temp);

        container.appendChild(card);
    });
}

/**
 * ========================================
 * ERROR HANDLING
 * ========================================
 * @param {string} message - User-friendly error message
 */
export function showError(message) {
    const errorEl = elements.errorMsg;
    const textEl = elements.errorText;

    // Set message
    textEl.textContent = message || 'Something went wrong. Please try again.';

    // Show error with a slide-down animation
    errorEl.classList.remove('hidden');

    // Auto-hide after 5 seconds
    clearTimeout(errorEl._hideTimeout);
    errorEl._hideTimeout = setTimeout(() => {
        hideError();
    }, 5000);
}

export function hideError() {
    elements.errorMsg.classList.add('hidden');
}

/**
 * ========================================
 * RESET UI (clear weather and forecast)
 * ========================================
 * Useful when a new search starts or when
 * the user clears the input.
 */
export function resetUI() {
    // Show loading, hide data
    showLoading();

    // Clear weather fields (optional, but good UX)
    elements.cityName.textContent = '--';
    elements.countryName.textContent = '--';
    elements.weatherIcon.src = 'assets/icons/default.svg';
    elements.weatherIcon.alt = 'Weather icon';
    elements.tempValue.textContent = '--';
    elements.weatherCondition.textContent = '--';
    elements.humidity.textContent = '--%';
    elements.windSpeed.textContent = '-- km/h';
    elements.feelsLike.textContent = '--°C';
    elements.lastUpdated.textContent = 'Last updated: --';

    // Reset forecast
    const container = elements.forecastContainer;
    container.innerHTML = `<p class="forecast-placeholder">Search for a city to see the forecast.</p>`;

    // Hide any existing error
    hideError();
}

/**
 * ========================================
 * UPDATE TEMPERATURE UNIT (optional)
 * ========================================
 * If you want to toggle between °C and °F,
 * you can add this function later.
 */
// export function setUnit(unit) { ... }
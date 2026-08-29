/**
 * ========================================
 * API CONFIGURATION
 * ========================================
 * Get your free API key at:
 * https://openweathermap.org/api
 * (Sign up → API Keys → copy the default key)
 */
const API_KEY = 'ac9fb47222ea7c2813430d92f06a3a47'; // 🔑 Replace with your actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * ========================================
 * HELPER: Format API response errors
 * ========================================
 */
class WeatherAPIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'WeatherAPIError';
    }
}

/**
 * ========================================
 * HELPER: Build URL with query params
 * ========================================
 */
function buildUrl(endpoint, params) {
    const url = new URL(`${BASE_URL}/${endpoint}`);
    url.search = new URLSearchParams({
        ...params,
        appid: API_KEY,
        units: 'metric', // 'metric' for °C, 'imperial' for °F
    }).toString();
    return url.toString();
}

/**
 * ========================================
 * FETCH CURRENT WEATHER BY CITY NAME
 * ========================================
 * @param {string} city - City name (e.g., "London")
 * @returns {Promise<object>} - Current weather data
 */
export async function fetchWeatherByCity(city) {
    if (!city || city.trim() === '') {
        throw new WeatherAPIError('City name is required', 400);
    }

    try {
        const url = buildUrl('weather', { q: city.trim() });
        const response = await fetch(url);

        // Handle HTTP errors
        if (!response.ok) {
            if (response.status === 404) {
                throw new WeatherAPIError('City not found. Please check the name.', 404);
            } else if (response.status === 401) {
                throw new WeatherAPIError('Invalid API key. Please check your credentials.', 401);
            } else {
                throw new WeatherAPIError(`Server error (${response.status})`, response.status);
            }
        }

        const data = await response.json();
        return parseCurrentWeather(data);
    } catch (error) {
        // Re-throw network errors (e.g., no internet)
        if (error instanceof WeatherAPIError) throw error;
        throw new WeatherAPIError('Network error. Please check your connection.', 0);
    }
}

/**
 * ========================================
 * FETCH CURRENT WEATHER BY COORDINATES
 * ========================================
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<object>} - Current weather data
 */
export async function fetchWeatherByCoords(lat, lon) {
    if (lat === undefined || lon === undefined) {
        throw new WeatherAPIError('Latitude and longitude are required', 400);
    }

    try {
        const url = buildUrl('weather', { lat, lon });
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                throw new WeatherAPIError('Location not found.', 404);
            } else {
                throw new WeatherAPIError(`Server error (${response.status})`, response.status);
            }
        }

        const data = await response.json();
        return parseCurrentWeather(data);
    } catch (error) {
        if (error instanceof WeatherAPIError) throw error;
        throw new WeatherAPIError('Network error. Please check your connection.', 0);
    }
}

/**
 * ========================================
 * FETCH 5-DAY FORECAST BY CITY NAME
 * ========================================
 * @param {string} city - City name
 * @returns {Promise<Array>} - Array of daily forecast objects (5 days)
 */
export async function fetchForecastByCity(city) {
    if (!city || city.trim() === '') {
        throw new WeatherAPIError('City name is required', 400);
    }

    try {
        const url = buildUrl('forecast', { q: city.trim() });
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                throw new WeatherAPIError('City not found for forecast.', 404);
            } else {
                throw new WeatherAPIError(`Server error (${response.status})`, response.status);
            }
        }

        const data = await response.json();
        return parseForecast(data);
    } catch (error) {
        if (error instanceof WeatherAPIError) throw error;
        throw new WeatherAPIError('Network error. Please check your connection.', 0);
    }
}

/**
 * ========================================
 * FETCH 5-DAY FORECAST BY COORDINATES
 * ========================================
 */
export async function fetchForecastByCoords(lat, lon) {
    if (lat === undefined || lon === undefined) {
        throw new WeatherAPIError('Latitude and longitude are required', 400);
    }

    try {
        const url = buildUrl('forecast', { lat, lon });
        const response = await fetch(url);

        if (!response.ok) {
            throw new WeatherAPIError(`Server error (${response.status})`, response.status);
        }

        const data = await response.json();
        return parseForecast(data);
    } catch (error) {
        if (error instanceof WeatherAPIError) throw error;
        throw new WeatherAPIError('Network error. Please check your connection.', 0);
    }
}

/**
 * ========================================
 * PARSE CURRENT WEATHER DATA
 * ========================================
 * Transforms raw API response into a clean, app-friendly object.
 */
function parseCurrentWeather(raw) {
    return {
        city: raw.name,
        country: raw.sys.country,
        temp: Math.round(raw.main.temp),
        feelsLike: Math.round(raw.main.feels_like),
        humidity: raw.main.humidity,
        windSpeed: Math.round(raw.wind.speed * 3.6), // Convert m/s → km/h
        condition: raw.weather[0].description,
        icon: raw.weather[0].icon,        // e.g., "01d"
        iconUrl: `https://openweathermap.org/img/wn/${raw.weather[0].icon}@2x.png`,
        timestamp: new Date(raw.dt * 1000), // Convert Unix → Date
    };
}

/**
 * ========================================
 * PARSE 5-DAY FORECAST DATA
 * ========================================
 * OpenWeatherMap returns 3-hourly data (40 entries = 5 days).
 * We group by day and pick the midday (12:00) reading for each day.
 */
function parseForecast(raw) {
    const dailyMap = new Map();

    raw.list.forEach((entry) => {
        const date = new Date(entry.dt * 1000);
        const dayKey = date.toISOString().split('T')[0]; // "YYYY-MM-DD"

        // Only take readings around noon (11:00 - 14:00) for a stable daily temp
        const hour = date.getHours();
        if (hour >= 11 && hour <= 14) {
            if (!dailyMap.has(dayKey)) {
                dailyMap.set(dayKey, {
                    date: date,
                    dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    temp: Math.round(entry.main.temp),
                    icon: entry.weather[0].icon,
                    iconUrl: `https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png`,
                    condition: entry.weather[0].description,
                });
            }
        }
    });

    // If we have fewer than 5 days (e.g., API returns less), take the first available entries.
    // But usually we get 5. Convert Map to array and take first 5.
    const result = Array.from(dailyMap.values()).slice(0, 5);

    // Fallback: if grouping by noon gave us nothing (edge case), take the first 5 unique days
    if (result.length === 0) {
        const fallbackMap = new Map();
        raw.list.forEach((entry) => {
            const date = new Date(entry.dt * 1000);
            const dayKey = date.toISOString().split('T')[0];
            if (!fallbackMap.has(dayKey)) {
                fallbackMap.set(dayKey, {
                    date: date,
                    dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    temp: Math.round(entry.main.temp),
                    icon: entry.weather[0].icon,
                    iconUrl: `https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png`,
                    condition: entry.weather[0].description,
                });
            }
        });
        return Array.from(fallbackMap.values()).slice(0, 5);
    }

    return result;
}
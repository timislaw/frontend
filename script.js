document.getElementById("getForecastButton").addEventListener("click", async () => {
    const city = document.getElementById("cityInput").value.trim();
    const state = document.getElementById("stateInput").value.trim();
    const country = document.getElementById("countryInput").value.trim();

    const output = document.getElementById("forecast");
    const citySelection = document.getElementById("citySelection");

    if (output) output.innerHTML = "Loading...";
    if (citySelection) {
        citySelection.innerHTML = "";
        citySelection.style.display = "none";
    }
    const baseUrl = "https://weatherappcs350.trafficmanager.net/api/getweatherforecast";

    const apiUrl = `${baseUrl}?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`;
    try {
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!res.ok) {
            if (output) output.innerHTML = data.error || "Error searching for city.";
            return;
        }

        if (data.matches && data.matches.length > 0) {
            if (output) output.innerHTML = "";
            renderCitySelection(data.matches);
        } else if (data.forecast) {
            renderForecast(data.forecast.forecast_5day);
        }
    } catch (err) {
        console.error("Error:", err);
        if (output) output.innerHTML = "Error searching for city.";
    }
});

function renderCitySelection(matches) {
    const citySelection = document.getElementById("citySelection");
    if (!citySelection) return;

    let html = `<h3>Multiple matches found. Please select your city:</h3>`;

    matches.forEach((match, index) => {
        const locationString = `${match.name}, ${match.state ? match.state + ', ' : ''}${match.country} (${match.lat}, ${match.lng})`;
        html += `
            <label class="city-option">
                <input type="radio" name="cityRadio" value="${match.lat},${match.lng}" ${index === 0 ? 'checked' : ''}>
                ${locationString}
            </label>
        `;
    });

    html += `<button id="confirmCityButton" style="margin-top: 10px;">Get Weather for Selected</button>`;

    citySelection.innerHTML = html;
    citySelection.style.display = "block";

    document.getElementById("confirmCityButton").addEventListener("click", async () => {
        const selected = document.querySelector('input[name="cityRadio"]:checked');
        if (selected) {
            const [lat, lon] = selected.value.split(",");
            const apiUrl = `https://weatherappcs350.trafficmanager.net/api/getweatherforecast?lat=${lat}&lon=${lon}`;

            const output = document.getElementById("forecast");
            if (output) output.innerHTML = "Loading forecast...";

            await fetchWeather(apiUrl);
        }
    });
}

async function checkAuth() {
    try {
        const response = await fetch('/.auth/me');
        const data = await response.json();

        const loginLink = document.getElementById('login-link');
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');

        if (data.clientPrincipal) {
            if (loginLink) loginLink.style.display = 'none';
            if (userInfo) userInfo.style.display = 'inline';
            if (userName) userName.textContent = data.clientPrincipal.userDetails;
            return true;
        } else {
            if (loginLink) loginLink.style.display = 'inline';
            if (userInfo) userInfo.style.display = 'none';
            return false;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}
checkAuth();

async function fetchWeather(apiUrl) {
    const output = document.getElementById("forecast");
    try {
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!res.ok) {
            if (output) output.innerHTML = data.error || "Error fetching forecast.";
            return;
        }

        if (data.forecast && data.forecast.forecast_5day) {
            renderForecast(data.forecast.forecast_5day);
        } else if (Array.isArray(data)) {
            renderForecast(data);
        } else {
            console.error("Unexpected forecast format:", data);
            if (output) output.innerHTML = "Unexpected forecast format received.";
        }

    } catch (err) {
        console.error("Fetch error:", err);
        if (output) output.innerHTML = "Error fetching forecast.";
    }
}

function renderForecast(forecasts) {
    const output = document.getElementById("forecast");
    if (!output) return;

    output.innerHTML = "";

    if (!forecasts || forecasts.length === 0) {
        output.innerHTML = "No forecast data returned.";
        return;
    }

    forecasts.forEach(day => {
        const div = document.createElement("div");
        div.className = "forecast-day";
        div.innerHTML = `
            <h4>${day.day || day.date || "Forecast"}</h4>
            <p>${day.date || ""}</p>
            <p><strong>High ${Math.round(day.temperature?.high || day.high || 0)}°F / Low ${Math.round(day.temperature?.low || day.low || 0)}°F</strong></p>
            <p>${day.condition || day.summary || ""}</p>
        `;
        output.appendChild(div);
    });
}
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

    let apiUrl = "";

    //  change this back to '/api/GetWeatherForecast' for deployed azure url
    //  testing local url
    const baseUrl = "https://weatherappcs350.trafficmanager.net/api/GetWeatherForecast";

    apiUrl = `${baseUrl}?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`;
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
                // Just in case it returns forecast directly
                renderForecast(data.forecast.forecast_5day);
            }
        } catch (err) {
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
            const apiUrl = `https://weatherappcs350.trafficmanager.net/api/GetWeatherForecast?lat=${lat}&lon=${lon}`;
            
            const output = document.getElementById("forecast");
            if (output) output.innerHTML = "Loading forecast...";
            
            await fetchWeather(apiUrl);
        }
    });
}

async function fetchWeather(apiUrl) {
    const output = document.getElementById("forecast");
    try {
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!res.ok) {
            if (output) output.innerHTML = data.error || "Error fetching forecast.";
            return;
        }

        renderForecast(data.forecast.forecast_5day);

    } catch (err) {
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
            <h4>${day.day}</h4>
            <p>${day.date}</p>
            <p><strong> High ${Math.round(day.temperature.high)}°F / Low ${Math.round(day.temperature.low)}°F</strong></p>
            <p>${day.condition}</p>
        `;
        output.appendChild(div);
    });
}
const REGIONS = [
    {
        name: "West US 2",
        url: "https://weatherapp20260602190007-cnawcze6hgfeczbf.westus2-01.azurewebsites.net/api/getweatherforecast",
        healthy: true,
        region: "westus2"
    },
    {
        name: "Central US",
        url: "https://weatherapp20260602191313-acbbb8hrbge4fvfj.centralus-01.azurewebsites.net/api/getweatherforecast",
        healthy: true,
        region: "centralus"
    }
];

let currentRegionIndex = 0;
let lastUsedRegion = null;

async function callWeatherAPI(city, state, country) {
    for (let attempt = 0; attempt < REGIONS.length; attempt++) {
        const region = REGIONS[currentRegionIndex];

        try {
            const url = `${region.url}?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`;
            console.log(`Attempting to use region: ${region.name}`);

            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                lastUsedRegion = region.name;
                console.log(`Successfully used region: ${region.name}`);
                return data;
            } else {
                console.log(`Region ${region.name} returned error: ${response.status}`);
                region.healthy = false;
            }
        } catch (error) {
            console.log(`Region ${region.name} failed: ${error.message}`);
            region.healthy = false;
        }

        currentRegionIndex = (currentRegionIndex + 1) % REGIONS.length;
    }

    throw new Error("All regions are unavailable");
}

function updateRoutingStatus() {
    const statusDiv = document.getElementById("routing-status");
    if (statusDiv) {
        statusDiv.innerHTML = `
            <div class="routing-info">
                <strong>Geo-Redundant Routing:</strong><br>
                ${REGIONS.map(r => `${r.name}: ${r.healthy ? '✅ Active' : '⚠️ Degraded'}`).join(' | ')}
                ${lastUsedRegion ? `<br>Last used: ${lastUsedRegion}` : ''}
            </div>
        `;
    }
}

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

    try {
        const data = await callWeatherAPI(city, state, country);
        updateRoutingStatus();

        if (data.matches && data.matches.length > 0) {
            if (output) output.innerHTML = "";
            renderCitySelection(data.matches);
        } else if (data.forecast) {
            renderForecast(data.forecast.forecast_5day);
        } else if (data.error) {
            if (output) output.innerHTML = data.error;
        }
    } catch (err) {
        console.error("Error:", err);
        if (output) output.innerHTML = "Error searching for city. Please try again.";
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

    const confirmButton = document.getElementById("confirmCityButton");
    if (confirmButton) {
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

        newConfirmButton.addEventListener("click", async () => {
            const selected = document.querySelector('input[name="cityRadio"]:checked');
            if (selected) {
                const [lat, lon] = selected.value.split(",");
                await getForecastByCoordinates(lat, lon);
            }
        });
    }
}

async function getForecastByCoordinates(lat, lon) {
    const output = document.getElementById("forecast");
    if (output) output.innerHTML = "Loading forecast...";

    try {
        for (let attempt = 0; attempt < REGIONS.length; attempt++) {
            const region = REGIONS[currentRegionIndex];

            try {
                const url = `${region.url}?lat=${lat}&lon=${lon}`;
                const response = await fetch(url);

                if (response.ok) {
                    const data = await response.json();
                    if (data.forecast && data.forecast.forecast_5day) {
                        renderForecast(data.forecast.forecast_5day);
                        updateRoutingStatus();
                        return;
                    }
                }
            } catch (error) {
                console.log(`Region ${region.name} failed for forecast`);
            }
            currentRegionIndex = (currentRegionIndex + 1) % REGIONS.length;
        }
        throw new Error("All regions failed");
    } catch (err) {
        console.error("Forecast error:", err);
        if (output) output.innerHTML = "Error fetching forecast.";
    }
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

checkAuth();
updateRoutingStatus();
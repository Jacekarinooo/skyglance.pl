const apiKey = "9e811d4a61f64f97a11215052261501";
const apiUrl = "https://api.weatherapi.com/v1/forecast.json?key=";

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const weatherContent = document.querySelector(".weather-content");
const errorMsg = document.querySelector(".error-msg");

function getAqiDescription(index) {
    switch(index) {
        case 1: return "Świetna";
        case 2: return "Dobra";
        case 3: return "Umiarkowana";
        case 4: return "Niezdrowa";
        case 5: return "Szkodliwa";
        case 6: return "Niebezpieczna";
        default: return "Brak danych";
    }
}

function translateMoonPhase(phase) {
    const phases = {
        "New Moon": "Nów",
        "Waxing Crescent": "Sierp przybywający",
        "First Quarter": "Pierwsza kwadra",
        "Waxing Gibbous": "Garb rosnący",
        "Full Moon": "Pełnia",
        "Waning Gibbous": "Garb malejący",
        "Last Quarter": "Ostatnia kwadra",
        "Waning Crescent": "Sierp ubywający"
    };

    return phases[phase] || phase;
}

function convertTo24Hour(time12h) {
    if (!time12h) return "--:--";

    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }

    return `${hours}:${minutes}`;
}

function getDayName(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { weekday: 'long' });
}

async function getWeather(city) {
    const url = `${apiUrl}${apiKey}&q=${city}&days=3&aqi=yes&lang=pl`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Błąd pobierania");
        const data = await response.json();
        
        console.log(data); 
        
        searchInput.value = data.location.name;

        document.querySelector(".city-name").innerText = data.location.name;
        document.querySelector(".date-time").innerText = data.location.localtime;
        document.querySelector(".temp").innerText = Math.round(data.current.temp_c) + "°C";
        document.querySelector(".condition").innerText = data.current.condition.text;
        document.querySelector(".feels-like").innerText = Math.round(data.current.feelslike_c);
        
        let iconUrl = "https:" + data.current.condition.icon;
        document.querySelector(".weather-icon").src = iconUrl.replace("64x64", "128x128");

        document.querySelector(".humidity").innerText = data.current.humidity + "%";
        document.querySelector(".wind").innerText = data.current.wind_kph + " km/h";
        document.querySelector(".wind-dir").innerText = "Kierunek: " + data.current.wind_dir;
        document.querySelector(".pressure").innerText = data.current.pressure_mb + " hPa";
        document.querySelector(".uv-index").innerText = data.current.uv;
        document.querySelector(".visibility").innerText = data.current.vis_km + " km";
        
        if(data.current.air_quality) {
            const aqiIndex = data.current.air_quality['us-epa-index'];
            const aqiElement = document.querySelector(".aqi");
            
            aqiElement.innerText = aqiIndex;
            document.querySelector(".aqi-text").innerText = getAqiDescription(aqiIndex);
            
            if (aqiIndex <= 2) aqiElement.style.color = "#00e676";
            else if (aqiIndex <= 4) aqiElement.style.color = "#ffeb3b";
            else aqiElement.style.color = "#ff3d00";
        }

        const todayForecast = data.forecast.forecastday[0];
        document.querySelector(".rain-chance").innerText = todayForecast.day.daily_chance_of_rain + "%";
        document.querySelector(".sunrise").innerText = convertTo24Hour(todayForecast.astro.sunrise);
        document.querySelector(".sunset").innerText = convertTo24Hour(todayForecast.astro.sunset);
        document.querySelector(".moon-phase").innerText = translateMoonPhase(todayForecast.astro.moon_phase);

        const hourlyContainer = document.getElementById("hourly-container");
        hourlyContainer.innerHTML = ""; 

        data.forecast.forecastday[0].hour.forEach(hour => {
            const time = hour.time.split(" ")[1];
            const temp = Math.round(hour.temp_c);
            const icon = "https:" + hour.condition.icon;
            const rain = hour.chance_of_rain > 0 ? `<span style="font-size:0.7rem; color:#4fc3f7">${hour.chance_of_rain}%</span>` : '';

            const html = `
                <div class="hourly-item">
                    <span>${time}</span>
                    <img src="${icon}" alt="ikona">
                    <span>${temp}°C</span>
                    ${rain}
                </div>
            `;
            hourlyContainer.innerHTML += html;
        });

        const dailyContainer = document.getElementById("daily-container");
        dailyContainer.innerHTML = "";
        
        for(let i = 1; i < data.forecast.forecastday.length; i++) {
            const dayData = data.forecast.forecastday[i];
            const dateName = getDayName(dayData.date);
            const maxTemp = Math.round(dayData.day.maxtemp_c);
            const minTemp = Math.round(dayData.day.mintemp_c);
            const icon = "https:" + dayData.day.condition.icon;
            const rainChance = dayData.day.daily_chance_of_rain;

            const html = `
                <div class="daily-item">
                    <div class="day-date">
                        <p>${dateName}</p>
                        <small style="font-size:0.75rem; color:#ccc;">Deszcz: ${rainChance}%</small>
                    </div>
                    <div class="day-condition">
                        <img src="${icon}" alt="ikona">
                        <span style="font-size:0.9rem">${dayData.day.condition.text}</span>
                    </div>
                    <div class="day-temp">
                        ${maxTemp}° / ${minTemp}°
                    </div>
                </div>
            `;
            dailyContainer.innerHTML += html;
        }

        weatherContent.style.display = "block";
        errorMsg.style.display = "none";
        localStorage.setItem('lastCity', city);

    } catch (err) {
        console.error(err);
        weatherContent.style.display = "none";
        errorMsg.style.display = "block";
    }
}

searchBtn.addEventListener("click", () => {
    const city = searchInput.value;
    if(city) getWeather(city);
});

searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && searchInput.value) {
        getWeather(searchInput.value);
    }
});

window.addEventListener('load', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const query = `${lat},${lon}`;
                getWeather(query);
            },
            
            (error) => {
                console.warn("Geolokalizacja niedostępna:", error.message);
                const savedCity = localStorage.getItem('lastCity') || "Warszawa";
                getWeather(savedCity);
            }
        );
    } else {
        const savedCity = localStorage.getItem('lastCity') || "Warszawa";
        getWeather(savedCity);
    }
});

const infoBtn = document.getElementById('info-btn');
const infoContent = document.getElementById('info-content');
const infoIcon = infoBtn.querySelector('i');

infoBtn.addEventListener('click', () => {
    if (infoContent.style.display === 'block') {
        infoContent.style.display = 'none';
        infoIcon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    } else {
        infoContent.style.display = 'block';
        infoIcon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    }
});
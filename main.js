/* Wetterstationen Tirol Beispiel */

let innsbruck = {
    lat: 47.267222,
    lng: 11.392778,
    zoom: 11
};

// WMTS Hintergrundlayer von https://lawinen.report (CC BY avalanche.report) als Startlayer
let startLayer = L.tileLayer("https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
    attribution: '&copy; <a href="https://lawinen.report">CC BY avalanche.report</a>'
})

// Overlays Objekt für die thematischen Layer
let overlays = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    humidity: L.featureGroup(),
    snowheight: L.featureGroup(),
    wind: L.featureGroup(),
};

// Karte initialisieren
let map = L.map("map", {
    center: [innsbruck.lat, innsbruck.lng],
    zoom: innsbruck.zoom,
    layers: [
        startLayer
    ],
});

// Layer control mit WMTS Hintergründen und Overlays
let layerControl = L.control.layers({
    "Relief avalanche.report": startLayer,
    "Esri World Imagery": L.tileLayer.provider("Esri.WorldImagery"),
}, {
    "Wetterstationen": overlays.stations,
    "Temperatur": overlays.temperature,
    "Relative Luftfeuchtigkeit": overlays.humidity,
    "Schneehöhe": overlays.snowheight,
    "Wind": overlays.wind
}).addTo(map);

// Layer control ausklappen
layerControl.expand();

// Maßstab control
L.control.scale({
    imperial: false
}).addTo(map);

// Fullscreen control
L.control.fullscreen().addTo(map);

// diese Layer beim Laden anzeigen
overlays.stations.addTo(map);


// Farbe eritteln für draw Temperature
let getColor = function(value, ramp){
    for (let rule of ramp){
        if(value >= rule.min && value < rule.max){
            return rule.color; 
        }
    }
}
 
// Stationen
let drawStations = function (geojson) {
    // Wetterstationen mit Icons und Popups implementieren
    L.geoJson(geojson, {
        pointToLayer: function (geoJsonPoint, latlng) {
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)<br>
                Temperatur: ${geoJsonPoint.properties.LT} °C
                <br>
                Schneehöhe: ${geoJsonPoint.properties.HS} cm
                <br>
                Windgeschwindigkeit: ${(geoJsonPoint.properties.WG * 3600) / 1000} km/h 
                <br>
                Windrichtung: ${geoJsonPoint.properties.WR}°
                <br>
                Relative Luftfeuchtigkeit: ${geoJsonPoint.properties.RH} %
                <br> 
                ${geojson.plot()}
            `;
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: `icons/wifi.png`,
                    iconAnchor: [16, 37],
                    popupAnchor: [0, -37]
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.stations);
}

// Temperatur 
let drawTemperature = function (geojson) {
    L.geoJson(geojson, {
        filter: function(geoJsonPoint){
            // return geoJsonPoint.properties.LT > -50 && geoJsonPoint.properties.LT < 50;
            return isFinite (geoJsonPoint.properties.LT); 
        },
        pointToLayer: function (geoJsonPoint, latlng) {
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)
            `;
            let color = getColor(geoJsonPoint.properties.LT, COLORS.temperature); 

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${geoJsonPoint.properties.LT.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.temperature);
}

// Schneehöhen 
let drawSnowheight = function(geojson){
    L.geoJson(geojson, {
        filter: function(geoJsonPoint){
            return geoJsonPoint.properties.HS >= 0 && geoJsonPoint.properties.HS < 400000;
        },
        pointToLayer: function (geoJsonPoint, latlng) {
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)
            `;
            let color = getColor(geoJsonPoint.properties.HS, COLORS.height); 

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${geoJsonPoint.properties.HS.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.snowheight);
}

// Wind 
let drawWind = function(geojson) {
    L.geoJson(geojson, {
        filter: function(geoJsonPoint){
            return geoJsonPoint.properties.WG > 0 && geoJsonPoint.properties.WG < 1000 && geoJsonPoint.properties.WR > 0;
           
        },
        pointToLayer: function (geoJsonPoint, latlng) {
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)
            `;
            let color = getColor(geoJsonPoint.properties.WG, COLORS.windspeed); 



            let deg = geoJsonPoint.properties.WR

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}; transform: rotate(${deg}deg)"><i class="fa-solid fa-circle-arrow-up"></i>${geoJsonPoint.properties.WG.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.wind);
}

// Wind 
let drawRH = function(geojson) {
    L.geoJson(geojson, {
        filter: function(geoJsonPoint){
            return geoJsonPoint.properties.RH > 0 && geoJsonPoint.properties.RH < 1000;
           
        },
        pointToLayer: function (geoJsonPoint, latlng) {
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)
            `;
            let color = getColor(geoJsonPoint.properties.RH, COLORS.humidity); 

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${geoJsonPoint.properties.RH.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.humidity);
}




// Wetterstationen
async function loadData(url) {
    let response = await fetch(url);
    let geojson = await response.json();

    drawStations(geojson);
    drawTemperature(geojson);
    drawSnowheight(geojson); 
    drawWind(geojson);
    drawRH(geojson);  
}
loadData("https://static.avalanche.report/weather_stations/stations.geojson");
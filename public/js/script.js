/***************************************
 * Map Related Code using Leaflet Map
 ***************************************/
const mapElement = document.getElementById('map');
const map = L.map(mapElement).setView([0, 0], 30);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker; // Global marker for GPS location
let userLocationMarker; // For user's location (if needed)
let userLocationCircle; // For accuracy circle

const userIcon = L.icon({
  iconUrl: 'map_dot.png', // Path to your blue dot icon image
  iconSize: [17, 17],
  iconAnchor: [8, 8]
});

if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(function(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    if (userLocationMarker) {
      userLocationMarker.setLatLng([userLat, userLng]);
      userLocationCircle.setLatLng([userLat, userLng]);
      userLocationCircle.setRadius(accuracy);
    } else {
      userLocationMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
      userLocationMarker.bindPopup("Your location");
      userLocationCircle = L.circle([userLat, userLng], {
        color: 'blue',
        fillColor: '#cacaca',
        fillOpacity: 0.5,
        radius: accuracy
      }).addTo(map);
    }
  }, function(error) {
    console.error("Error occurred while watching location: ", error);
  }, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 27000
  });
} else {
  console.log("Geolocation is not supported by this browser.");
}

/***************************************
 * Chart Related Code using Chart.js
 ***************************************/

// Plugin to fill the entire canvas with a dark background before drawing
var imageBG = {
  beforeDraw: function(chartInstance) {
    const ctx = chartInstance.ctx;
    ctx.save();
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(0, 0, chartInstance.width, chartInstance.height);
    ctx.restore();
  }
};

// Shared dark theme options for all charts
const darkChartOptions = {
  scales: {
    x: {
      grid: { color: "#444" },
      ticks: { color: "#e0e0e0" }
    },
    y: {
      grid: { color: "#444" },
      ticks: { color: "#e0e0e0" },
      beginAtZero: false
    }
  },
  animation: { duration: 0 },
  plugins: {
    legend: { labels: { color: "#e0e0e0" } }
  }
};

// Global arrays to accumulate data
let tempLabels = [];
let tempDataArray = [];

let pressureLabels = [];
let pressureDataArray = [];

let altitudeLabels = [];
let altitudeDataArray = [];

let velocityLabels = [];
let velocityDataArray = [];

// Create Temperature Chart
const tempChartElement = document.getElementById('temperature').getContext('2d');
const tempChart = new Chart(tempChartElement, {
  type: 'line',
  data: {
    labels: tempLabels,
    datasets: [{
      label: 'Temperature',
      data: tempDataArray,
      backgroundColor: 'rgba(237, 125, 49, 0.5)',
      borderColor: 'rgba(237, 125, 49, 1)',
      borderWidth: 1,
      pointRadius: 0
    }]
  },
  options: darkChartOptions,
  plugins: [imageBG]
});

// Create Pressure Chart
const pressureChartElement = document.getElementById('pressure').getContext('2d');
const pressureChart = new Chart(pressureChartElement, {
  type: 'line',
  data: {
    labels: pressureLabels,
    datasets: [{
      label: 'Pressure',
      data: pressureDataArray,
      backgroundColor: 'rgba(112, 173, 71, 0.5)',
      borderColor: 'rgba(112, 173, 71, 1)',
      borderWidth: 1,
      pointRadius: 0
    }]
  },
  options: darkChartOptions,
  plugins: [imageBG]
});

// Create Altitude Chart
const altitudeChartElement = document.getElementById('altitude').getContext('2d');
const altitudeChart = new Chart(altitudeChartElement, {
  type: 'line',
  data: {
    labels: altitudeLabels,
    datasets: [{
      label: 'Altitude',
      data: altitudeDataArray,
      backgroundColor: 'rgba(106, 90, 205, 0.5)',
      borderColor: 'rgba(106, 90, 205, 1)',
      borderWidth: 1,
      pointRadius: 0
    }]
  },
  options: darkChartOptions,
  plugins: [imageBG]
});

// Create Velocity Chart
const velocityChartElement = document.getElementById('velocity').getContext('2d');
const velocityChart = new Chart(velocityChartElement, {
  type: 'line',
  data: {
    labels: velocityLabels,
    datasets: [{
      label: 'Velocity',
      data: velocityDataArray,
      backgroundColor: 'rgba(220, 20, 60, 0.5)',
      borderColor: 'rgba(220, 20, 60, 1)',
      borderWidth: 1,
      pointRadius: 0
    }]
  },
  options: darkChartOptions,
  plugins: [imageBG]
});

/***************************************
 * Helper Function: Append New Data to Global Arrays
 ***************************************/
function appendNewData(newRows) {
  // newRows is an array of rows, each row being an array of cell strings.
  newRows.forEach(row => {
    // Expected CSV columns:
    // 0: Time, 1: Temperature, 2: Pressure, 3: Altitude, 4: Latitude, 5: Longitude, etc.
    const t = row[0];
    tempLabels.push(t);
    tempDataArray.push(parseFloat(row[1]));
    
    pressureLabels.push(t);
    pressureDataArray.push(parseFloat(row[2]));
    
    altitudeLabels.push(t);
    altitudeDataArray.push(parseFloat(row[3]));
  });
  
  // Recalculate velocity from entire accumulated data
  velocityLabels = [];
  velocityDataArray = [];
  const timeData = tempLabels.map(Number);
  for (let i = 1; i < timeData.length; i++) {
    const deltaTime = timeData[i] - timeData[i - 1];
    const deltaAltitude = altitudeDataArray[i] - altitudeDataArray[i - 1];
    velocityLabels.push(tempLabels[i]);
    velocityDataArray.push(deltaTime !== 0 ? deltaAltitude / deltaTime : 0);
  }
}

/***************************************
 * WebSocket Connection for Data Updates
 ***************************************/
const ws = new WebSocket('ws://localhost:3000/data');

ws.onopen = function() {
  console.log('WebSocket connection established');
};

ws.onerror = function(error) {
  console.error('WebSocket Error:', error);
};

ws.onclose = function(event) {
  console.log('WebSocket connection closed', event.code, event.reason);
};

ws.onmessage = (event) => {
  // Parse CSV data from the new message (assumed to be only new rows)
  const newRows = parseCSV(event.data);
  if (newRows.length === 0) return;
  
  // Append the new data to global arrays
  appendNewData(newRows);
  
  // Update each chart using the updated global arrays
  tempChart.update();
  pressureChart.update();
  altitudeChart.update();
  velocityChart.data.labels = velocityLabels;
  velocityChart.data.datasets[0].data = velocityDataArray;
  velocityChart.update();
  
  // Update map marker using the latest row (columns 4 and 5)
  const latestRow = newRows[newRows.length - 1];
  const latitude = parseFloat(latestRow[4]);
  const longitude = parseFloat(latestRow[5]);
  if (!isNaN(latitude) && !isNaN(longitude)) {
    if (marker) {
      marker.setLatLng([latitude, longitude]);
    } else {
      marker = L.marker([latitude, longitude]).addTo(map);
    }
    map.setView([latitude, longitude], 30);
  }
};

/***************************************
 * CSV Parsing Helper Function
 ***************************************/
function parseCSV(csvString) {
  const rows = csvString.trim().split(/\r?\n/);
  // If a header exists, remove it; assume header is present only in the first message.
  if (rows.length && rows[0].includes("Time")) {
    rows.shift();
  }
  return rows.map(row => row.split(',').map(cell => cell.trim()));
}

/***************************************
 * Chart Download Function
 ***************************************/
function downloadChart(chart, fileName) {
  const originalSize = { width: chart.width, height: chart.height };
  chart.resize(1920, 1080);
  chart.update({ duration: 0 }, true);
  const downloadLink = document.createElement('a');
  downloadLink.href = chart.toBase64Image();
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  chart.resize(originalSize.width, originalSize.height);
  chart.update({ duration: 0 });
}

/***************************************
 * Chart Download Event Listeners
 ***************************************/
document.getElementById("temp_png").addEventListener('click', () => {
  downloadChart(tempChart, 'tempChart.png');
});
document.getElementById("pressure_png").addEventListener('click', () => {
  downloadChart(pressureChart, 'pressureChart.png');
});
document.getElementById("altitude_png").addEventListener('click', () => {
  downloadChart(altitudeChart, 'altitudeChart.png');
});
document.getElementById("velocity_png").addEventListener('click', () => {
  downloadChart(velocityChart, 'velocityChart.png');
});

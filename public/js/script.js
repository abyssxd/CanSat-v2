/***************************************
 * Load Configuration Files
 ***************************************/
async function loadConfig(filePath) {
  try {
    const response = await fetch(filePath);
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return null;
  }
}

/***************************************
 * Dynamic Map Setup Using Leaflet
 ***************************************/
async function setupMap() {
  const mapConfig = await loadConfig("/config/map.json");
  if (!mapConfig) return;

  const mapElement = document.getElementById("map");
  const map = L.map(mapElement).setView(
    [mapConfig.defaultView.lat, mapConfig.defaultView.lng],
    mapConfig.defaultView.zoom
  );

  L.tileLayer(mapConfig.tileLayer, {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  let marker;
  let userLocationMarker;
  let userLocationCircle;

  if (mapConfig.enableUserLocation && "geolocation" in navigator) {
    navigator.geolocation.watchPosition(
      function (position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        if (userLocationMarker) {
          userLocationMarker.setLatLng([userLat, userLng]);
          userLocationCircle.setLatLng([userLat, userLng]);
          userLocationCircle.setRadius(accuracy);
        } else {
          userLocationMarker = L.marker([userLat, userLng]).addTo(map);
          userLocationMarker.bindPopup("Your location");
          userLocationCircle = L.circle([userLat, userLng], {
            color: "blue",
            fillColor: "#cacaca",
            fillOpacity: 0.5,
            radius: accuracy,
          }).addTo(map);
        }
      },
      function (error) {
        console.error("Error occurred while watching location:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 27000,
      }
    );
  }
}

/***************************************
 * Chart Configuration & Creation
 ***************************************/

// Plugin to fill the entire canvas with a dark background
var imageBG = {
  beforeDraw: function (chartInstance) {
    const ctx = chartInstance.ctx;
    ctx.save();
    ctx.fillStyle = "#1c1c1c";
    ctx.fillRect(0, 0, chartInstance.width, chartInstance.height);
    ctx.restore();
  },
};

// Shared dark theme options
const darkChartOptions = {
  scales: {
    x: { grid: { color: "#444" }, ticks: { color: "#e0e0e0" } },
    y: { grid: { color: "#444" }, ticks: { color: "#e0e0e0" }, beginAtZero: false },
  },
  animation: { duration: 0 },
  plugins: { legend: { labels: { color: "#e0e0e0" } } },
};

let charts = {}; // Store dynamically created charts

async function setupCharts() {
  const graphConfig = await loadConfig("/config/graphs.json");
  if (!graphConfig) return;

  const chartContainer = document.getElementById("chartContainer");
  chartContainer.innerHTML = ""; // Clear existing charts

  graphConfig.graphs.forEach((graph) => {
    if (graph.enabled) {
      // Create chart container
      const chartDiv = document.createElement("div");
      chartDiv.classList.add("chart");

      // Create canvas for the chart
      const canvas = document.createElement("canvas");
      canvas.id = graph.id;

      // Create download link
      const downloadLink = document.createElement("a");
      downloadLink.classList.add("download", graph.id);
      downloadLink.id = graph.id + "_png";
      downloadLink.textContent = "Download Chart Image";

      // Append elements
      chartDiv.appendChild(canvas);
      chartDiv.appendChild(downloadLink);
      chartContainer.appendChild(chartDiv);

      // Create the chart
      charts[graph.id] = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
          labels: [],
          datasets: [{
            label: graph.label,
            data: [],
            backgroundColor: graph.color,
            borderColor: graph.color,
            borderWidth: 1,
            pointRadius: 0
          }]
        },
        options: darkChartOptions,
        plugins: [imageBG],
      });

      // Event Listener for Downloading the Chart
      downloadLink.addEventListener("click", () => {
        downloadChart(charts[graph.id], graph.id + ".png");
      });
    }
  });
}

/***************************************
 * WebSocket Connection for Live Updates
 ***************************************/
const ws = new WebSocket("ws://localhost:3000/data");

ws.onopen = function () {
  console.log("WebSocket connection established");
};

ws.onerror = function (error) {
  console.error("WebSocket Error:", error);
};

ws.onclose = function (event) {
  console.log("WebSocket connection closed", event.code, event.reason);
};

ws.onmessage = async (event) => {
  const graphConfig = await loadConfig("/config/graphs.json");
  if (!graphConfig) return;

  // Parse incoming CSV data
  const newRows = parseCSV(event.data);
  if (newRows.length === 0) return;

  newRows.forEach((row) => {
    const time = row[0];
    graphConfig.graphs.forEach((graph, index) => {
      if (graph.enabled) {
        const chart = charts[graph.id];
        if (chart) {
          chart.data.labels.push(time);
          chart.data.datasets[0].data.push(parseFloat(row[index + 1]));
          chart.update();
        }
      }
    });
  });
};

/***************************************
 * CSV Parsing Helper Function
 ***************************************/
function parseCSV(csvString) {
  const rows = csvString.trim().split(/\r?\n/);
  if (rows.length && rows[0].includes("Time")) rows.shift();
  return rows.map((row) => row.split(",").map((cell) => cell.trim()));
}

/***************************************
 * Chart Download Function
 ***************************************/
function downloadChart(chart, fileName) {
  const originalSize = { width: chart.width, height: chart.height };
  chart.resize(1920, 1080);
  chart.update({ duration: 0 }, true);
  const downloadLink = document.createElement("a");
  downloadLink.href = chart.toBase64Image();
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  chart.resize(originalSize.width, originalSize.height);
  chart.update({ duration: 0 });
}

/***************************************
 * Initialize Everything
 ***************************************/
async function initializeDashboard() {
  // Call initializeNavbar() from global.js
  if (typeof initializeNavbar === "function") {
    await initializeNavbar();
  }
  await setupCharts();
  await setupMap();
}

document.addEventListener("DOMContentLoaded", initializeDashboard);

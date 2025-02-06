// charts.js

/***************************************
 * 1. Custom Plugin & Chart Creation
 ***************************************/

// Plugin to fill the entire canvas with a black background before drawing
var imageBG = {
    beforeDraw: function(chartInstance) {
        var ctx = chartInstance.ctx;
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

// Create Temperature Chart
const tempChartElement = document.getElementById('temperature').getContext('2d');
const tempChart = new Chart(tempChartElement, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperature',
            data: [],
            backgroundColor: 'rgba(237, 125, 49, 0.5)',
            borderColor: 'rgba(237, 125, 49, 1)',
            borderWidth: 1,
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
        labels: [],
        datasets: [{
            label: 'Pressure',
            data: [],
            backgroundColor: 'rgba(112, 173, 71, 0.5)',
            borderColor: 'rgba(112, 173, 71, 1)',
            borderWidth: 1,
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
        labels: [],
        datasets: [{
            label: 'Altitude',
            data: [],
            backgroundColor: 'rgba(106, 90, 205, 0.5)',
            borderColor: 'rgba(106, 90, 205, 1)',
            borderWidth: 1,
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
        labels: [],
        datasets: [{
            label: 'Velocity',
            data: [],
            backgroundColor: 'rgba(220, 20, 60, 0.5)',
            borderColor: 'rgba(220, 20, 60, 1)',
            borderWidth: 1,
        }]
    },
    options: darkChartOptions,
    plugins: [imageBG]
});

/***************************************
 * 2. Display Control Functions
 ***************************************/
function showTemp() {
    document.getElementById("temperature").style.display = "block";
    document.getElementById("pressure").style.display = "none";
    document.getElementById("altitude").style.display = "none";
    document.getElementById("velocity").style.display = "none";
    document.getElementById("temp_png").style.display = "block";
    document.getElementById("pressure_png").style.display = "none";
    document.getElementById("altitude_png").style.display = "none";
    document.getElementById("velocity_png").style.display = "none";
    document.getElementById("tempchart").style.display= "block";
    document.getElementById("preschart").style.display= "none";
    document.getElementById("altichart").style.display= "none";
    document.getElementById("velochart").style.display= "none";
}

function showPressure() {
    document.getElementById("temperature").style.display = "none";
    document.getElementById("pressure").style.display = "block";
    document.getElementById("altitude").style.display = "none";
    document.getElementById("velocity").style.display = "none";
    document.getElementById("temp_png").style.display = "none";
    document.getElementById("tempchart").style.display= "none";
    document.getElementById("pressure_png").style.display = "block";
    document.getElementById("altitude_png").style.display = "none";
    document.getElementById("velocity_png").style.display = "none";
    document.getElementById("preschart").style.display= "block";
    document.getElementById("altichart").style.display= "none";
    document.getElementById("velochart").style.display= "none";
}

function showAltitude() {
    document.getElementById("temperature").style.display = "none";
    document.getElementById("pressure").style.display = "none";
    document.getElementById("altitude").style.display = "block";
    document.getElementById("velocity").style.display = "none";
    document.getElementById("temp_png").style.display = "none";
    document.getElementById("tempchart").style.display= "none";
    document.getElementById("pressure_png").style.display = "none";
    document.getElementById("altitude_png").style.display = "block";
    document.getElementById("velocity_png").style.display = "none";
    document.getElementById("preschart").style.display= "none";
    document.getElementById("altichart").style.display= "block";
    document.getElementById("velochart").style.display= "none";
}

function showVelocity() {
    document.getElementById("temperature").style.display = "none";
    document.getElementById("pressure").style.display = "none";
    document.getElementById("altitude").style.display = "none";
    document.getElementById("velocity").style.display = "block";
    document.getElementById("temp_png").style.display = "none";
    document.getElementById("tempchart").style.display= "none";
    document.getElementById("pressure_png").style.display = "none";
    document.getElementById("altitude_png").style.display = "none";
    document.getElementById("velocity_png").style.display = "block";
    document.getElementById("preschart").style.display= "none";
    document.getElementById("altichart").style.display= "none";
    document.getElementById("velochart").style.display= "block";
}

/***************************************
 * 3. Chart Download Function
 ***************************************/
function downloadChart(chart, fileName) {
    // Save original sizes
    var originalSize = { width: chart.width, height: chart.height };

    // Temporarily resize chart for download (e.g., 1920x1080 for a 16:9 aspect ratio)
    chart.resize(1920, 1080);
    chart.update({ duration: 0 }, true);

    // Create a temporary link to trigger the download
    var downloadLink = document.createElement('a');
    downloadLink.href = chart.toBase64Image();
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Restore original chart size
    chart.resize(originalSize.width, originalSize.height);
    chart.update({ duration: 0 });
}

/***************************************
 * 4. WebSocket and CSV Data Handling
 ***************************************/
const ws = new WebSocket('ws://localhost:3000');

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
    // Parse incoming CSV data
    const csvData = parseCSV(event.data);
    
    // Extract time labels from the first column
    const time = csvData.map(row => row[0]);
    
    // Update Temperature Chart (2nd column)
    const tempData = csvData.map(row => parseFloat(row[1]));
    updateChartData(tempChart, time, tempData);
    
    // Update Pressure Chart (3rd column)
    const pressureData = csvData.map(row => parseFloat(row[2]));
    updateChartData(pressureChart, time, pressureData);
    
    // Update Altitude Chart (4th column)
    const altitudeData = csvData.map(row => parseFloat(row[3]));
    updateChartData(altitudeChart, time, altitudeData);
    
    // Calculate Velocity based on Altitude and Time differences
    function calculateVelocity(data) {
        const altData = data.map(row => parseFloat(row[3]));
        const timeData = data.map(row => parseFloat(row[0]));
        let velocities = [];
        for (let i = 1; i < timeData.length; i++) {
            let deltaTime = timeData[i] - timeData[i - 1];
            let deltaAltitude = altData[i] - altData[i - 1];
            velocities.push(deltaTime !== 0 ? deltaAltitude / deltaTime : 0);
        }
        return velocities;
    }
    const velocities = calculateVelocity(csvData);
    // Velocity chart uses labels starting from the second time entry
    updateChartData(velocityChart, time.slice(1), velocities);
    
    // Update map marker if latitude (5th column) and longitude (6th column) are provided
    const latestRow = csvData[csvData.length - 1];
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

// Parse CSV data (removes header row)
function parseCSV(csvString) {
    const rows = csvString.trim().split(/\r?\n/);
    rows.shift(); // Remove header
    return rows.map(row => row.split(',').map(cell => cell.trim()));
}

// Update chart data and refresh the chart
function updateChartData(chart, labels, data) {
    chart.data.labels = labels;
    chart.data.datasets.forEach(dataset => {
        dataset.data = data;
    });
    chart.update();
}

/***************************************
 * 5. Chart Download Event Listeners
 ***************************************/
document.getElementById("temp_png").addEventListener('click', function() {
    downloadChart(tempChart, 'tempChart.png');
});
document.getElementById("pressure_png").addEventListener('click', function() {
    downloadChart(pressureChart, 'pressureChart.png');
});
document.getElementById("altitude_png").addEventListener('click', function() {
    downloadChart(altitudeChart, 'altitudeChart.png');
});
document.getElementById("velocity_png").addEventListener('click', function() {
    downloadChart(velocityChart, 'velocityChart.png');
});

/***************************************
 * 1. Load Configuration for Graphs
 ***************************************/
const configPath = "config/graphs.json";
let graphsConfig = [];

fetch(configPath)
  .then(response => response.json())
  .then(data => {
    graphsConfig = data.graphs.filter(graph => graph.enabled);
    initializeGraphs(graphsConfig);
  })
  .catch(error => console.error("Error loading graph config:", error));

/***************************************
 * 2. Custom Plugin & Chart Creation
 ***************************************/

// Plugin to fill the entire canvas with a dark background before drawing
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

let charts = {}; // Store all charts dynamically

function initializeGraphs(graphs) {
    graphs.forEach(graph => {
        const canvasElement = document.getElementById(graph.id);
        if (!canvasElement) {
            console.warn(`Canvas element for ${graph.id} not found!`);
            return;
        }

        const ctx = canvasElement.getContext('2d');
        charts[graph.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: graph.label,
                    data: [],
                    backgroundColor: graph.backgroundColor,
                    borderColor: graph.color,
                    borderWidth: 1,
                    pointRadius: graph.pointRadius
                }]
            },
            options: darkChartOptions,
            plugins: [imageBG]
        });
    });
}

/***************************************
 * 3. WebSocket and CSV Data Handling
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
    const newRows = parseCSV(event.data);
    if (newRows.length === 0) return;

    newRows.forEach(row => {
        const time = row[0];

        graphsConfig.forEach(graph => {
            if (charts[graph.id]) {
                charts[graph.id].data.labels.push(time);
                charts[graph.id].data.datasets[0].data.push(parseFloat(row[graphsConfig.indexOf(graph) + 1]));
                charts[graph.id].update();
            }
        });
    });
};

// Parse CSV data (removes header row if present)
function parseCSV(csvString) {
    const rows = csvString.trim().split(/\r?\n/);
    if (rows.length > 0 && rows[0].includes("Time")) {
        rows.shift();
    }
    return rows.map(row => row.split(',').map(cell => cell.trim()));
}

/***************************************
 * 4. Chart Download Function
 ***************************************/
function downloadChart(chartId, fileName) {
    if (!charts[chartId]) {
        console.error(`Chart ${chartId} not found!`);
        return;
    }

    var chart = charts[chartId];
    var originalSize = { width: chart.width, height: chart.height };

    chart.resize(1920, 1080);
    chart.update({ duration: 0 }, true);

    var downloadLink = document.createElement('a');
    downloadLink.href = chart.toBase64Image();
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    chart.resize(originalSize.width, originalSize.height);
    chart.update({ duration: 0 });
}

/***************************************
 * 5. Chart Download Event Listeners
 ***************************************/
document.querySelectorAll(".download a").forEach(downloadBtn => {
    downloadBtn.addEventListener('click', function() {
        const chartId = this.id.replace("_png", "");
        downloadChart(chartId, `${chartId}.png`);
    });
});

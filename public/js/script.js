// Map Related code using Leaftlet Map ----- START
const mapElement = document.getElementById('map');
const map = L.map(mapElement).setView([0, 0], 30);

//Credits are important.
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker; //The variable that stores the marker for the GPS marker
let userLocationMarker; //The variable that stores the marker for the user marker
let userLocationCircle; // The variable to show a circle that shows the accuracy radius

const userIcon = L.icon({
    iconUrl: 'map_dot.png', // Provide the path to your blue dot icon image
    iconSize: [17, 17], // This can be the actual size of your icon
    iconAnchor: [8, 8] // Adjust as needed to center the icon
});

if ("geolocation" in navigator) { //Check if the browser has geolocation support
    navigator.geolocation.watchPosition(function(position) { //Watch the live position of the user
        const userLat = position.coords.latitude; //Define & store the device latitude in the userLat variable
        const userLng = position.coords.longitude; //Define & store the device longitude in the userLng variable
        const accuracy = position.coords.accuracy; //Define & store the location accuracy in the accuracy variable

        if (userLocationMarker) { //If the user location marker already exists, then update it
            userLocationMarker.setLatLng([userLat, userLng]); //Set the latitude and longitude for the user marker
            userLocationCircle.setLatLng([userLat, userLng]); //Set the latitude and longitude for the circle
            userLocationCircle.setRadius(accuracy); //Set the circle radius according to the location accuracy
        } else { //If the user location marker doesn't already exist
            userLocationMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
            userLocationMarker.bindPopup("Your location"); //Add a popup to the user location marker to avoid confusion, was initially added before I changed the marker to a circle icon.
            userLocationCircle = L.circle([userLat, userLng], { //The accuracy radius circle
                color: 'blue',
                fillColor: '#cacaca',
                fillOpacity: 0.5,
                radius: accuracy
            }).addTo(map); //Adds the circle to the map ofc, if you don't know that then why're you even checking this file
        }

    }, function(error) {
        console.error("Error occurred while watching location: ", error);
    }, {
        //This will make sure the location given is the actual location and not a previously cached location
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 27000
    });
} else {
    console.log("Geolocation is not supported by this browser."); //oh no! an error!
}
// Map Related code ----- END

// Created Charts ----- START





//Create the tempreature chart using chart.js and assign it to the div with the temperature ID.
// Define the plugin
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

// Get the chart element
const tempChartElement = document.getElementById('temperature').getContext('2d');

// Create the chart with the plugin
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
            pointRadius: 0
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: false //Don't begin the chart at 0
            }
        },
        animation: {
            duration: 0, //Cancel the animation because it looks weird when this chart updates literally every second
        }
    },
    options: darkChartOptions,
    plugins: [imageBG] // Add a white background for when the chart's image is created
});


//Create the altitude chart using chart.js and assign it to the div with the altitude ID.
const altitudeChartElement = document.getElementById('altitude').getContext('2d');
const altitudeChart = new Chart(altitudeChartElement, {
    type: 'line', //Type of chart
    data: {
        labels: [],
        datasets: [{
            label: 'Altitude', //The label of the chart
            data: [],
            backgroundColor: 'rgba(106, 90, 205, 0.5)',
            borderColor: 'rgba(106, 90, 205, 1)',
            borderWidth: 1,
            pointRadius: 0
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: false //Don't begin the chart at 0
            }
        },
        animation: {
            duration: 0, //Cancel the animation because it looks weird when this chart updates literally every second
        }
    },
    options: darkChartOptions,
    plugins: [imageBG] // Add a white background for when the chart's image is created
});

//Create the pressure chart using chart.js and assign it to the div with the pressure ID.
const pressureChartElement = document.getElementById('pressure').getContext('2d');
const pressureChart = new Chart(pressureChartElement, {
    type: 'line', //Type of chart
    data: {
        labels: [],
        datasets: [{
            label: 'Pressure', //The label of the chart
            data: [],
            backgroundColor: 'rgba(112, 173, 71, 0.5)',
            borderColor: 'rgba(112, 173, 71, 1)',
            borderWidth: 1,
            pointRadius: 0
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: false //Don't begin the chart at 0
            }
        },
        animation: {
            duration: 0, //Cancel the animation because it looks weird when this chart updates literally every second
        }
    },
    options: darkChartOptions,
    plugins: [imageBG] // Add a white background for when the chart's image is created
});


//Create the velocity chart using chart.js and assign it to the div with the velocity ID.
const velocityChartElement = document.getElementById('velocity').getContext('2d');
const velocityChart = new Chart(velocityChartElement, {
    type: 'line', //Type of chart
    data: {
        labels: [],
        datasets: [{
            label: 'Velocity', //The label of the chart
            data: [],
            backgroundColor: 'rgba(220, 20, 60, 0.5)',
            borderColor: 'rgba(220, 20, 60, 1)',
            borderWidth: 1,
            pointRadius: 0
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: false //Don't begin the chart at 0
            }
        },
        animation: {
            duration: 0, //Cancel the animation because it looks weird when this chart updates literally every second
        }
    },
    options: darkChartOptions,
    plugins: [imageBG] // Add a white background for when the chart's image is created
});
// Created Charts ----- END

function downloadChart(chart, fileName) {
    // Save original sizes
    var originalSize = {
        width: chart.width,
        height: chart.height
    };

    // Temporarily resize chart to desired download size
    chart.resize(1920, 1080); // for a 16:9 aspect ratio

    // Trigger download after resize
    chart.update({
        duration: 0 // Update instantly
    }, true); // Pass `true` as the second argument to make the resize happen immediately

    // Create a temporary link for the download
    var downloadLink = document.createElement('a');
    downloadLink.href = chart.toBase64Image();
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink); // Needed for Firefox
    downloadLink.click();
    document.body.removeChild(downloadLink); // Clean up

    // Restore original chart sizes
    chart.resize(originalSize.width, originalSize.height);
    chart.update({
        duration: 0
    });
}



//Websocket connection ---- START
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
//Websocket connection ---- END

//Chart downloads
const tempChartDownloadPNG = document.getElementById("temp_png");
tempChartDownloadPNG.addEventListener('click', function() {
    downloadChart(tempChart, 'tempChart.png');
});

const pressureChartDownloadPNG = document.getElementById("pressure_png");
pressureChartDownloadPNG.addEventListener('click', function() {
    downloadChart(pressureChart, 'pressureChart.png');
});

const altitudeChartDownloadPNG = document.getElementById("altitude_png");
altitudeChartDownloadPNG.addEventListener('click', function() {
    downloadChart(altitudeChart, 'altitudeChart.png');
});

const velocityChartDownloadPNG = document.getElementById("velocity_png");
velocityChartDownloadPNG.addEventListener('click', function() {
    downloadChart(velocityChart, 'velocityChart.png');
});

//Listen for new changes to the csv files using the websocket
ws.onmessage = (event) => {

    //Store the parseed cv data sent by the websocket in a variable
    const csvData = parseCSV(event.data);

    //Add the time from the CSV file to the time variable
    const time = csvData.map(row => row[0]); // Prepend "0" to the time labels


    const tempData = csvData.map(row => parseFloat(row[1])); //Add the tempreature from the CSV file to the tempData variable
    updateChartData(tempChart, time, tempData); //Update temperature chart using tempData & time variable

    
    //Update pressure chart
    const pressureData = csvData.map(row => parseFloat(row[2])); //Add the pressure from the CSV file to the pressureData variable
    updateChartData(pressureChart, time, pressureData); //Update pressure chart using pressureData & time variable


    //Update altitude chart
    const altitudeData = csvData.map(row => parseFloat(row[3])); //Add the altitude from the CSV file to the altitudeData variable
    updateChartData(altitudeChart, time, altitudeData); //Update altitude chart using altitudeData & time variable



    //Function to calculate Velocity
    function calculateVelocity(csvData) {

        const altitudeData = csvData.slice(1).map(row => parseFloat(row[3])); //Set the altitude to the altitudeData variable
        const timeData = csvData.slice(1).map(row => parseFloat(row[0])); //Set the time to the timeData variable

        let velocities = [];

        //Loop through the entire csv file and calculate the delta time & delta altitude for each row and store them in deltaTime & deltaAltitude variables
        for (let i = 0; i < timeData.length; i++) {
            let deltaTime = timeData[i] - timeData[i - 1];
            let deltaAltitude = altitudeData[i] - altitudeData[i - 1];

            // Avoid division by zero
            if (deltaTime !== 0) {
                velocities.push(deltaAltitude / deltaTime);
            } else {
                velocities.push(0);
            }
        }
        //return the calculated velocity
        return velocities;
    }


    const velocities = calculateVelocity(csvData); //Store the velocities in the velocities array

    updateChartData(velocityChart, time, velocities); //Update the velocity chart with the data


    const latestRow = csvData[csvData.length - 1]; //Get the latest row for the latest GPS location
    const latitude = parseFloat(latestRow[4]); //Store the latitude in the latitude variable
    const longitude = parseFloat(latestRow[5]); //Store the longitude in the longitude variable

    if (!isNaN(latitude) && !isNaN(longitude)) { //Check if the latitude and logitude values are NaN, if they are, it seems not place the marker and mess up the map.
        if (marker) {
            marker.setLatLng([latitude, longitude]); //If the marker already exists, update it to the new location sent by the web socket.
        } else {
            marker = L.marker([latitude, longitude]).addTo(map); //If the marker doesn't exist, create the marker and add it to the leaflet map.
        }
        map.setView([latitude, longitude], 30); //Set the map view, and the zoom.
    }

};

//Function to parse the CSV & tirm the values. This should work both on windows and linux.
function parseCSV(csvString) {
    const rows = csvString.trim().split(/\r?\n/);
    return rows.map(row => row.split(',').map(cell => cell.trim()));
}

//Fuction to update the chart data with the data provided in the ws.onmessage event.
function updateChartData(chart, labels, data) {
    chart.data.labels = labels;
    chart.data.datasets.forEach((dataset) => {
        dataset.data = data;
    });
    chart.update();
}
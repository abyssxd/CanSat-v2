// Status WebSocket Connection using a dedicated endpoint
const ws = new WebSocket('ws://localhost:3000/status');

ws.onopen = () => {
    console.log('Status WebSocket connection established');
};

ws.onerror = error => {
    console.error('Status WebSocket Error:', error);
};

ws.onclose = event => {
    console.log('Status WebSocket connection closed', event.code, event.reason);
};

ws.onmessage = (event) => {
    const csvData = parseCSV(event.data);
    if (csvData.length === 0) return;
    const latestData = csvData[csvData.length - 1];

    // Extract sensor values (assumed indices; adjust if necessary)
    const seeds_deployed = latestData[18];
    const gps_sats = latestData[7];
    const bmp_status = latestData[11];
    const gps_status = latestData[12];
    const gyro_status = latestData[13];
    const apc_status = latestData[14];
    const servo_status = latestData[15];
    const servo_rotation = latestData[16];
    const sd_status = latestData[17];

    const bmp_temp = latestData[1];
    const bmp_pressure = latestData[2];
    const bmp_altitude = latestData[3];

    const gps_longitude = latestData[4];
    const gps_latitude = latestData[5];
    const gps_altitude = latestData[6];

    const gyro_x = latestData[8];
    const gyro_y = latestData[9];
    const gyro_z = latestData[10];

    // Show error block if all sensors are offline
    if (bmp_status != 1 && gps_status != 1 && gyro_status != 1 && apc_status != 1 && servo_status != 1 && sd_status != 1) {
        document.getElementById("errorBlock").style.display = "block";
    } else {
        document.getElementById("errorBlock").style.display = "none";
    }

    // Update BMP-280 display
    if (bmp_status != 1) {
        document.getElementById("bmpStatusText").style.backgroundColor = "#e24a4a";
        document.getElementById("bmpStatusText").innerHTML = "Offline";
    } else {
        document.getElementById("bmpStatusText").style.backgroundColor = "#01e774";
        document.getElementById("bmpStatusText").innerHTML = "Online";
        document.getElementById("bmpTemp").innerHTML = "Temperature: " + bmp_temp + " º";
        document.getElementById("bmpPressure").innerHTML = "Pressure: " + bmp_pressure + " Pa";
        document.getElementById("bmpAltitude").innerHTML = "Altitude: " + bmp_altitude + " m";
    }

    // Update GPS display
    if (gps_status != 1) {
        document.getElementById("gpsStatusText").style.backgroundColor = "#e24a4a";
        document.getElementById("gpsStatusText").innerHTML = "Offline";
    } else {
        document.getElementById("gpsStatusText").style.backgroundColor = "#01e774";
        document.getElementById("gpsStatusText").innerHTML = "Online";
        document.getElementById("gpsLat").innerHTML = "Latitude: " + gps_latitude;
        document.getElementById("gpsLong").innerHTML = "Longitude: " + gps_longitude;
        document.getElementById("gpsAltitude").innerHTML = "Altitude: " + gps_altitude + " m";
        document.getElementById("gpsSats").innerHTML = "Satellites: " + gps_sats;
    }

    // Update Gyroscope display
    if (gyro_status != 1) {
        document.getElementById("gyroStatusText").style.backgroundColor = "#e24a4a";
        document.getElementById("gyroStatusText").innerHTML = "Offline";
    } else {
        document.getElementById("gyroStatusText").style.backgroundColor = "#01e774";
        document.getElementById("gyroStatusText").innerHTML = "Online";
        document.getElementById("gyro_x").innerHTML = "Gyro X: " + gyro_x + " rad/s";
        document.getElementById("gyro_y").innerHTML = "Gyro Y: " + gyro_y + " rad/s";
        document.getElementById("gyro_z").innerHTML = "Gyro Z: " + gyro_z + " rad/s";
    }

    // Update APC220 display
    if (apc_status != 1) {
        document.getElementById("apcStatusText").style.backgroundColor = "#e24a4a";
        document.getElementById("apcStatusText").innerHTML = "Offline";
    } else {
        document.getElementById("apcStatusText").style.backgroundColor = "#01e774";
        document.getElementById("apcStatusText").innerHTML = "Online";
    }

    // Update Servo display
    if (servo_status != 1) {
        document.getElementById("servoStatusText").style.backgroundColor = "#e24a4a";
        document.getElementById("servoStatusText").innerHTML = "Offline";
    } else {
        document.getElementById("servoStatusText").style.backgroundColor = "#01e774";
        document.getElementById("servoStatusText").innerHTML = "Online";
        document.getElementById("servoRotation").innerHTML = "Rotation: " + servo_rotation + " º";
    }

    // Update SD Card display
    if (sd_status != 1) {
        document.getElementById("sdStatusText").style.backgroundColor = "#e24a4a";
        document.getElementById("sdStatusText").innerHTML = "Offline";
    } else {
        document.getElementById("sdStatusText").style.backgroundColor = "#01e774";
        document.getElementById("sdStatusText").innerHTML = "Online";
    }

    // Update Seeds Deployed display
    if (seeds_deployed != 1) {
        document.getElementById("seedsStatusText").style.backgroundColor = "#e24a4a";
        document.getElementById("seedsStatusText").innerHTML = "Undeployed";
    } else {
        document.getElementById("seedsStatusText").style.backgroundColor = "#01e774";
        document.getElementById("seedsStatusText").innerHTML = "Deployed";
    }

    // Overall System Status
    if (bmp_status == 1 && gps_status == 1 && gyro_status == 1 && apc_status == 1 && servo_status == 1 && sd_status == 1) {
        document.getElementById("sysStatusText").innerHTML = "Online";
        document.getElementById("sysStatusText").style.backgroundColor = "#01e774";
    } else if (bmp_status == 1 || gps_status == 1 || gyro_status == 1 || apc_status == 1 || servo_status == 1 || sd_status == 1) {
        document.getElementById("sysStatusText").innerHTML = "Partially Online";
        document.getElementById("sysStatusText").style.backgroundColor = "#ffd85c";
    } else {
        document.getElementById("sysStatusText").innerHTML = "Offline";
        document.getElementById("sysStatusText").style.backgroundColor = "#e24a4a";
    }
};

function parseCSV(csvString) {
    const rows = csvString.trim().split(/\r?\n/);
    return rows.map(row => row.split(',').map(cell => cell.trim()));
}

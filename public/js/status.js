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


//TEST ---- START
/*
        bmp_status = 0;
        gps_status = 0;
        gyro_status = 0;
        apc_status = 0;
        servo_rotation= 90;
        sd_status= 0;
        servo_status = 0;
        gps_sats= 5;


        bmp_temp = 25;
        bmp_pressure = 31;
        bmp_altitude = 63;

        
        gps_longitude = 41.382736;
        gps_latitude = 2.154902;
        gps_altitude = 25;

        gyro_x = 10;
        gyro_y = 10;
        gyro_z = 200;
        gyro_temp = 25;


        if (bmp_status != 1 && gps_status != 1 && gyro_status != 1 && apc_status != 1 && servo_status != 1 && sd_status != 1) {
        	system_status = 1;
            document.getElementById("errorBlock").style.display = "block";
        } else {
        	system_status = 0;
            document.getElementById("errorBlock").style.display = "none";
        }
        
        
        if (bmp_status != 1){
            document.getElementById("bmpStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("bmpStatusText").innerHTML = "Offline";
        }else{
            document.getElementById("bmpStatusText").style.backgroundColor = "#01e774";
            document.getElementById("bmpStatusText").innerHTML = "Online";
            document.getElementById("bmpTemp").innerHTML = "Tempreature: " + bmp_temp + " º";
            document.getElementById("bmpPressure").innerHTML = "Pressure: " + bmp_pressure + " Pa";
            document.getElementById("bmpAltitude").innerHTML = "Altitude: " + bmp_altitude + " m";
        }
        
        if (gps_status != 1){
            document.getElementById("gpsStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("gpsStatusText").innerHTML = "Offline";
        }else{
            document.getElementById("gpsStatusText").style.backgroundColor = "#01e774";
            document.getElementById("gpsStatusText").innerHTML = "Online";
            document.getElementById("gpsLat").innerHTML = "Latitude: " + gps_latitude;
            document.getElementById("gpsLong").innerHTML = "Longitude: " + gps_longitude;
            document.getElementById("gpsAltitude").innerHTML = "Altitude: " + gps_altitude + " m";
            document.getElementById("gpsSats").innerHTML = "Satallites: " + gps_sats;
        }
        
        if (gyro_status != 1){
            document.getElementById("gyroStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("gyroStatusText").innerHTML = "Offline";

        }else{
            document.getElementById("gyroStatusText").style.backgroundColor = "#01e774";
            document.getElementById("gyroStatusText").innerHTML = "Online";
            document.getElementById("gyro_x").innerHTML = "Gyro X: " + gyro_x + " rad/s";
            document.getElementById("gyro_y").innerHTML = "Gyro Y: " + gyro_y+ " rad/s";
            document.getElementById("gyro_z").innerHTML = "Gyro Z: " + gyro_z+ " rad/s";
            document.getElementById("gyro_temp").innerHTML = "Tempreature: " + gyro_temp+ " º";
        }
        
        if (apc_status != 1){
            document.getElementById("apcStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("apcStatusText").innerHTML = "Offline";
        }else {
            document.getElementById("apcStatusText").style.backgroundColor = "#01e774";
            document.getElementById("apcStatusText").innerHTML = "Online";
        }

        if (servo_status != 1){
            document.getElementById("servoStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("servoStatusText").innerHTML = "Offline";
        }else {
            document.getElementById("servoStatusText").style.backgroundColor = "#01e774";
            document.getElementById("servoStatusText").innerHTML = "Online";
            document.getElementById("servoRotation").innerHTML = "Rotation: " + servo_rotation+ " º";
        }

        if (sd_status != 1){
            document.getElementById("sdStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("sdStatusText").innerHTML = "Offline";
        }else {
            document.getElementById("sdStatusText").style.backgroundColor = "#01e774";
            document.getElementById("sdStatusText").innerHTML = "Online";
        }

        if (seeds_deployed != 1){
            document.getElementById("seedsStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("seedsStatusText").innerHTML = "Undeployed";
        }else {
            document.getElementById("seedsStatusText").style.backgroundColor = "#01e774";
            document.getElementById("seedsStatusText").innerHTML = "Deployed";
        }


        if(bmp_status == 1 && gps_status == 1 && gyro_status == 1 && apc_status == 1 && servo_status == 1 && sd_status == 1){
            document.getElementById("sysStatusText").innerHTML = "Online";
            document.getElementById("sysStatusText").style.backgroundColor = "#01e774";
        } else if (bmp_status == 1 || gps_status == 1 || gyro_status == 1 || apc_status == 1 || servo_status == 1 || sd_status == 1){
            document.getElementById("sysStatusText").innerHTML = "Partially Online";
            document.getElementById("sysStatusText").style.backgroundColor = "#ffd85c";
        } else {
            document.getElementById("sysStatusText").innerHTML = "Offline";
            document.getElementById("sysStatusText").style.backgroundColor = "#e24a4a";
        }

*/
//TEST ---- END



//Websocket connection ---- END

ws.onmessage = (event) => {
        const csvData = parseCSV(event.data);
        const latestData = csvData[csvData.length - 1];
        seeds_deployed =  latestData[18];
        gps_sats = latestData[7];
        bmp_status = latestData[11];
        gps_status = latestData[12];
        gyro_status = latestData[13];
        apc_status = latestData[14];
        servo_status = latestData[15];
        servo_rotation = latestData[16];
        sd_status = latestData[17];

        bmp_temp = latestData[1];
        bmp_pressure = latestData[2];
        bmp_altitude = latestData[3];

        
        gps_longitude = latestData[4];
        gps_latitude = latestData[5];
        gps_altitude = latestData[6];

        gyro_x = latestData[8];
        gyro_y = latestData[9];
        gyro_z = latestData[10];
        

        if (bmp_status != 1 && gps_status != 1 && gyro_status != 1 && apc_status != 1 && servo_status != 1 && sd_status != 1) {
        	system_status = 1;
            document.getElementById("errorBlock").style.display = "block";
        } else {
        	system_status = 0;
            document.getElementById("errorBlock").style.display = "none";
        }
        
        
        if (bmp_status != 1){
            document.getElementById("bmpStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("bmpStatusText").innerHTML = "Offline";
        }else{
            document.getElementById("bmpStatusText").style.backgroundColor = "#01e774";
            document.getElementById("bmpStatusText").innerHTML = "Online";
            document.getElementById("bmpTemp").innerHTML = "Tempreature: " + bmp_temp + " º";
            document.getElementById("bmpPressure").innerHTML = "Pressure: " + bmp_pressure + " Pa";
            document.getElementById("bmpAltitude").innerHTML = "Altitude: " + bmp_altitude + " m";
        }
        
        if (gps_status != 1){
            document.getElementById("gpsStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("gpsStatusText").innerHTML = "Offline";
        }else{
            document.getElementById("gpsStatusText").style.backgroundColor = "#01e774";
            document.getElementById("gpsStatusText").innerHTML = "Online";
            document.getElementById("gpsLat").innerHTML = "Latitude: " + gps_latitude;
            document.getElementById("gpsLong").innerHTML = "Longitude: " + gps_longitude;
            document.getElementById("gpsAltitude").innerHTML = "Altitude: " + gps_altitude + " m";
            document.getElementById("gpsSats").innerHTML = "Satallites: " + gps_sats;
        }
        
        if (gyro_status != 1){
            document.getElementById("gyroStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("gyroStatusText").innerHTML = "Offline";

        }else{
            document.getElementById("gyroStatusText").style.backgroundColor = "#01e774";
            document.getElementById("gyroStatusText").innerHTML = "Online";
            document.getElementById("gyro_x").innerHTML = "Gyro X: " + gyro_x + " rad/s";
            document.getElementById("gyro_y").innerHTML = "Gyro Y: " + gyro_y+ " rad/s";
            document.getElementById("gyro_z").innerHTML = "Gyro Z: " + gyro_z+ " rad/s";
        }
        
        if (apc_status != 1){
            document.getElementById("apcStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("apcStatusText").innerHTML = "Offline";
        }else {
            document.getElementById("apcStatusText").style.backgroundColor = "#01e774";
            document.getElementById("apcStatusText").innerHTML = "Online";
        }

        if (servo_status != 1){
            document.getElementById("servoStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("servoStatusText").innerHTML = "Offline";
        }else {
            document.getElementById("servoStatusText").style.backgroundColor = "#01e774";
            document.getElementById("servoStatusText").innerHTML = "Online";
            document.getElementById("servoRotation").innerHTML = "Rotation: " + servo_rotation+ " º";
        }

        if (sd_status != 1){
            document.getElementById("sdStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("sdStatusText").innerHTML = "Offline";
        }else {
            document.getElementById("sdStatusText").style.backgroundColor = "#01e774";
            document.getElementById("sdStatusText").innerHTML = "Online";
        }

        if (seeds_deployed != 1){
            document.getElementById("seedsStatusText").style.backgroundColor = "#e24a4a";
            document.getElementById("seedsStatusText").innerHTML = "Undeployed";
        }else {
            document.getElementById("seedsStatusText").style.backgroundColor = "#01e774";
            document.getElementById("seedsStatusText").innerHTML = "Deployed";
        }


        if(bmp_status == 1 && gps_status == 1 && gyro_status == 1 && apc_status == 1 && servo_status == 1 && sd_status == 1){
            document.getElementById("sysStatusText").innerHTML = "Online";
            document.getElementById("sysStatusText").style.backgroundColor = "#01e774";
        } else if (bmp_status == 1 || gps_status == 1 || gyro_status == 1 || apc_status == 1 || servo_status == 1 || sd_status == 1){
            document.getElementById("sysStatusText").innerHTML = "Partially Online";
            document.getElementById("sysStatusText").style.backgroundColor = "#ffd85c";
        } else {
            document.getElementById("sysStatusText").innerHTML = "Offline";
            document.getElementById("sysStatusText").style.backgroundColor = "#e24a4a";
        }

};


//Function to parse the CSV & tirm the values. This should work both on windows and linux.
function parseCSV(csvString) {
	const rows = csvString.trim().split(/\r?\n/);
	return rows.map(row => row.split(',').map(cell => cell.trim()));
}

const fs = require('fs');
const path = require('path');
const csvFile = path.join(__dirname, '..', 'sheet.csv');
const csvHeaders = ["Time", "Temperature", "Pressure", "Altitude", "Latitude", "Longitude", "gps_altitude", "gps_sats", "gyro_x", "gyro_y", "gyro_z", "bmp_status", "gps_status", "gyro_status", "apc_status", "servo_status", "servo_rotation", "sd_status"];

// Create the CSV file with headers if it doesn't exist
function createCSVIfNotExists() {
  if (!fs.existsSync(csvFile)) {
    const headerLine = csvHeaders.join(',') + '\n';
    fs.writeFileSync(csvFile, headerLine, 'utf8');
    console.log("CSV file created with headers.");
  }
}

// Append a new row (array of values) to the CSV file
function appendCSVRow(row) {
  return new Promise((resolve, reject) => {
    const line = row.join(',') + '\n';
    fs.appendFile(csvFile, line, (err) => {
      if (err) {
        console.error("Error appending to CSV:", err);
        reject(err);
      } else {
        console.log("Appended row to CSV:", row);
        resolve();
      }
    });
  });
}

// Reset the CSV file (remove and recreate headers)
function resetCSV() {
  return new Promise((resolve, reject) => {
    const headerLine = csvHeaders.join(',') + '\n';
    fs.writeFile(csvFile, headerLine, (err) => {
      if (err) {
        console.error("Error resetting CSV:", err);
        reject(err);
      } else {
        console.log("CSV file reset.");
        resolve();
      }
    });
  });
}

module.exports = {
  createCSVIfNotExists,
  appendCSVRow,
  resetCSV
};

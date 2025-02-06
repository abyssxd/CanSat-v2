const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const { appendCSVRow, createCSVIfNotExists } = require('./csvHandler');
const { insertData, renameAndCreateTable } = require('./mysqlHandler');
const { createInitialKML, updateKML } = require('./kmlHandler');
const { updateBackup } = require('./backupHandler');
const fs = require('fs');
const path = require('path');

const portName = "COM5"; // Change this to your Arduino's serial port
const baudRate = 9600;
const csvFile = path.join(__dirname, '..', 'sheet.csv');
const kmlFile = path.join(__dirname, '..', 'live_track.kml');

const csvHeaders = ["Time", "Temperature", "Pressure", "Altitude", "Latitude", "Longitude", "gps_altitude", "gps_sats", "gyro_x", "gyro_y", "gyro_z", "bmp_status", "gps_status", "gyro_status", "apc_status", "servo_status", "servo_rotation", "sd_status"];

// Initialize sensor values with "N/A"
let sensorValues = {};
csvHeaders.forEach(header => {
  sensorValues[header] = 'N/A';
});
let newDataReceived = false;
let coordinates = []; // To hold coordinate tuples [lon, lat, alt]

// Load any existing coordinates from the CSV (if available)
function loadExistingCoordinates() {
  if (fs.existsSync(csvFile)) {
    const data = fs.readFileSync(csvFile, 'utf8');
    const lines = data.split('\n').slice(1); // skip header
    lines.forEach(line => {
      const parts = line.split(',');
      if (parts.length >= 6) {
        let lat = parseFloat(parts[4]);
        let lon = parseFloat(parts[5]);
        let alt = parseFloat(parts[3]);
        if (!isNaN(lat) && !isNaN(lon) && !isNaN(alt)) {
          coordinates.push([lon, lat, alt]);
        }
      }
    });
  }
}

// Parse a data line (format: "key = value")
function parseDataLine(line) {
  const parts = line.split('=');
  if (parts.length === 2) {
    let key = parts[0].trim();
    let value = parts[1].trim();
    return { key, value };
  }
  return null;
}

// Process the collected sensor data: write CSV, update backup, insert into MySQL, update KML
async function processAndInsertData() {
  // Build a CSV row from sensorValues
  const row = csvHeaders.map(header => sensorValues[header] || 'N/A');
  await appendCSVRow(row);
  
  // Update backup files (CSV and KML)
  await updateBackup();
  
  // Insert data into MySQL
  await insertData(row);
  
  // Update KML if we have valid coordinate data
  if (sensorValues['Latitude'] !== 'N/A' && sensorValues['Longitude'] !== 'N/A' && sensorValues['Altitude'] !== 'N/A') {
    const newCoord = [
      parseFloat(sensorValues['Longitude']),
      parseFloat(sensorValues['Latitude']),
      parseFloat(sensorValues['Altitude'])
    ];
    coordinates.push(newCoord);
    await updateKML(coordinates, newCoord);
  }
}

// Start reading from the serial port
function startSerialReading() {
  // Ensure CSV file exists (creates header if needed)
  createCSVIfNotExists();
  // Create an initial KML file if it doesn’t exist
  if (!fs.existsSync(kmlFile)) {
    createInitialKML();
  }
  // Load any existing coordinate data from CSV
  loadExistingCoordinates();
  
  // Prepare the MySQL table (rename old table if exists and create a new one)
  renameAndCreateTable().then(() => {
    console.log("MySQL table prepared.");
  }).catch(err => {
    console.error("Error preparing MySQL table:", err);
  });
  
  const port = new SerialPort(portName, { baudRate: baudRate, autoOpen: false });
  const parser = port.pipe(new Readline({ delimiter: '\n' }));
  
  port.open(err => {
    if (err) {
      return console.error("Error opening serial port:", err.message);
    }
    console.log("Serial port opened:", portName);
  });
  
  parser.on('data', async (line) => {
    console.log("Received:", line);
    const parsed = parseDataLine(line);
    if (parsed && parsed.key) {
      // If we receive a new "Time" field and data was already collected,
      // process the previous dataset.
      if (parsed.key === 'Time' && newDataReceived) {
        await processAndInsertData();
        // Reset sensor values for the new dataset
        csvHeaders.forEach(header => {
          sensorValues[header] = 'N/A';
        });
        newDataReceived = false;
      }
      sensorValues[parsed.key] = parsed.value;
      newDataReceived = true;
    }
  });
  
  port.on('error', (err) => {
    console.error("Serial port error:", err.message);
  });
}

module.exports = {
  startSerialReading
};

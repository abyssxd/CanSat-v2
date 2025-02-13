const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { appendCSVRow, createCSVIfNotExists } = require('./csvHandler');
const { createInitialKML, updateKML } = require('./kmlHandler');
const { updateBackup } = require('./backupHandler');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config/csvFields.json');
const csvFile = path.join(__dirname, '..', 'sheet.csv');
const kmlFile = path.join(__dirname, '..', 'live_track.kml');

// Load CSV fields from config file
let csvHeaders = [];
function loadCSVConfig() {
  try {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    csvHeaders = configData.fields
      .filter(field => field.enabled) // Include only enabled fields
      .map(field => field.name);
  } catch (err) {
    console.error("Error loading CSV config:", err);
    process.exit(1); // Exit if the config file is missing or corrupted
  }
}

// Initialize sensor values with "N/A"
let sensorValues = {};
function resetSensorValues() {
  sensorValues = {};
  csvHeaders.forEach(header => {
    sensorValues[header] = 'N/A';
  });
}
resetSensorValues();

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

// Process the collected sensor data: write CSV, update backup, update KML
async function processAndInsertData() {
  const row = csvHeaders.map(header => sensorValues[header] || 'N/A');
  await appendCSVRow(row);
  
  await updateBackup();
  
  if (
    sensorValues['Latitude'] !== 'N/A' &&
    sensorValues['Longitude'] !== 'N/A' &&
    sensorValues['Altitude'] !== 'N/A'
  ) {
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
  loadCSVConfig(); // Load CSV configuration dynamically

  createCSVIfNotExists();
  if (!fs.existsSync(kmlFile)) {
    createInitialKML();
  }
  loadExistingCoordinates();

  const port = new SerialPort({ path: "COM4", baudRate: 9600, autoOpen: false });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
  
  port.open(err => {
    if (err) {
      return console.error("Error opening serial port:", err.message);
    }
    console.log("Serial port opened.");
  });

  parser.on('data', async (line) => {
    console.log("Received:", line);
    const parsed = parseDataLine(line);
    if (parsed && parsed.key) {
      if (parsed.key === 'Time' && newDataReceived) {
        await processAndInsertData();
        resetSensorValues();
        newDataReceived = false;
      }
      if (csvHeaders.includes(parsed.key)) {
        sensorValues[parsed.key] = parsed.value;
      }
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

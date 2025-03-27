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

let csvHeaders = [];
let serialConfig = {};

// Load CSV fields and serial config from the merged config file
function loadCSVConfig() {
  try {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    csvHeaders = configData.fields
      .filter(field => field.enabled) // Include only enabled fields
      .map(field => field.name);
    serialConfig = configData.serial;
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

// Parse a data line based on the configuration.
// First, it checks if the line is in JSON format. If not, it uses the serialConfig setting.
function parseDataLine(line) {
  if (serialConfig.trimSpaces) {
    line = line.trim();
  }

  // Auto-detect JSON format if the line starts with '{' and ends with '}'
  if (line.startsWith('{') && line.endsWith('}')) {
    try {
      return JSON.parse(line);
    } catch (err) {
      console.error("JSON parsing error:", err, "Line:", line);
      return null;
    }
  }

  // Otherwise, follow the configured format
  if (serialConfig.defaultFormat === 'json') {
    try {
      return JSON.parse(line);
    } catch (err) {
      console.error("JSON parsing error:", err, "Line:", line);
      return null;
    }
  } else if (serialConfig.defaultFormat === 'delimiter') {
    const parts = line.split(serialConfig.delimiter);
    if (parts.length !== 2) {
      console.error("Unexpected data format:", line);
      return null;
    }
    let key = parts[0];
    let value = parts[1];

    if (serialConfig.trimSpaces) {
      key = key.trim();
      value = value.trim();
    }
    return { key, value };
  } else {
    console.error("Unsupported format type in serial config:", serialConfig.defaultFormat);
    return null;
  }
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
  loadCSVConfig(); // Load CSV and serial configuration

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
    
    // For JSON format, parsed is an object with keys directly.
    // For delimiter format, parsed is an object with { key, value }.
    if (parsed) {
      // Handle delimiter-based input
      if (serialConfig.defaultFormat === 'delimiter' && parsed.key) {
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
      // Handle JSON-based input
      else if (serialConfig.defaultFormat === 'json') {
        // Use "Time" as a marker for a complete dataset.
        if (parsed.hasOwnProperty('Time') && newDataReceived) {
          await processAndInsertData();
          resetSensorValues();
          newDataReceived = false;
        }
        // Update sensor values only for the expected CSV fields
        Object.keys(parsed).forEach(key => {
          if (csvHeaders.includes(key)) {
            sensorValues[key] = parsed[key];
            newDataReceived = true;
          }
        });
      }
    }
  });

  port.on('error', (err) => {
    console.error("Serial port error:", err.message);
  });
}

module.exports = {
  startSerialReading
};

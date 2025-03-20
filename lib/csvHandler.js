const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '..', 'config', 'csvFields.json');
const csvFile = path.join(__dirname, '..', 'sheet.csv');

let csvHeaders = [];

// Load CSV headers from configuration
function loadCSVHeaders() {
  try {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    csvHeaders = configData.fields
      .filter(field => field.enabled)
      .map(field => field.name);
  } catch (err) {
    console.error("Error loading CSV headers:", err);
    process.exit(1);
  }
}

// Create the CSV file with headers if it doesn't exist
function createCSVIfNotExists() {
  loadCSVHeaders();
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
    loadCSVHeaders();
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

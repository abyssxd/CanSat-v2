const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { startSerialReading } = require('./lib/serialReader');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Function to broadcast CSV data to all connected clients
function broadcastCSVData(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

const csvFilePath = path.join(__dirname, 'sheet.csv');

// When a new client connects, send the initial CSV data
wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');
  fs.readFile(csvFilePath, 'utf8', (err, data) => {
    if (!err) {
      ws.send(data);
    }
  });
});

// Watch the CSV file for changes and broadcast updates
fs.watch(csvFilePath, (eventType, filename) => {
  if (filename && eventType === 'change') {
    fs.readFile(csvFilePath, 'utf8', (err, data) => {
      if (!err) {
        broadcastCSVData(data);
      }
    });
  }
});

// Start the serial reading process (which handles CSV, MySQL, KML, backups, etc.)
startSerialReading();

// Start the HTTP server on port 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { startSerialReading } = require('./lib/serialReader');
const { resetCSV } = require('./lib/csvHandler');

const backupFolder = path.join(__dirname, 'backup');
const csvFilePath = path.join(__dirname, 'sheet.csv');
const kmlFilePath = path.join(__dirname, 'live_track.kml');
const configFolder = path.join(__dirname, 'config');

const { createCSVIfNotExists } = require('./lib/csvHandler');

const app = express();

// To support JSON in POST requests (for settings updates)
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ----- Endpoints for Console Page Functionality -----

// Endpoint to download the current CSV file
app.get('/download/csv', (req, res) => {
  res.download(csvFilePath, 'sheet.csv', (err) => {
    if (err) {
      res.status(500).send("Error downloading CSV file");
    }
  });
});

// Endpoint to download the current KML file
app.get('/download/kml', (req, res) => {
  res.download(kmlFilePath, 'live_track.kml', (err) => {
    if (err) {
      res.status(500).send("Error downloading KML file");
    }
  });
});

// Endpoint to reset the CSV file (recreate header)
app.post('/reset/csv', async (req, res) => {
  try {
    await resetCSV();
    res.send("CSV file reset successfully.");
  } catch (err) {
    res.status(500).send("Error resetting CSV: " + err.message);
  }
});

// Endpoint to list backups
app.get('/backups', (req, res) => {
  fs.readdir(backupFolder, (err, files) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Create an array of backup objects.
    // Assumes filenames are like TIMESTAMP_sheet.csv or TIMESTAMP_live_track.kml.
    const backups = files.map(file => {
      const timestamp = file.split('_')[0];
      return { filename: file, timestamp };
    });
    res.json(backups);
  });
});

// Endpoint to download a specific backup file, expects query parameter ?file=
app.get('/download/backup', (req, res) => {
  const fileName = req.query.file;
  if (!fileName) {
    res.status(400).send("No file specified.");
    return;
  }
  const filePath = path.join(backupFolder, fileName);
  res.download(filePath, fileName, (err) => {
    if (err) {
      res.status(500).send("Error downloading backup: " + err.message);
    }
  });
});

// Endpoint to delete a specific backup file, expects query parameter ?file=
app.delete('/delete/backup', (req, res) => {
  const fileName = req.query.file;
  if (!fileName) {
    res.status(400).send("No file specified.");
    return;
  }
  const filePath = path.join(backupFolder, fileName);
  fs.unlink(filePath, (err) => {
    if (err) {
      res.status(500).send("Error deleting backup: " + err.message);
    } else {
      res.send("Backup deleted successfully.");
    }
  });
});

// ----- Endpoints for Updating JSON Configuration Files -----

app.post('/update-json', (req, res) => {
  const { file, data } = req.body;

  if (!file || !data) {
    return res.status(400).json({ error: "Missing file or data in request." });
  }

  const filePath = path.join(configFolder, path.basename(file));

  // Ensure the file exists before updating
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Configuration file not found." });
  }

  fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      return res.status(500).json({ error: "Error writing to configuration file." });
    }
    res.json({ message: `${file} updated successfully.` });
  });
});

// ----- Endpoints for Serving Configuration Files -----

// Route to serve individual config JSON files from the "config" folder
app.get('/config/:filename', (req, res) => {
  const filename = req.params.filename;
  // Only allow .json files
  if (!filename.endsWith('.json')) {
    return res.status(400).json({ error: "Invalid file requested." });
  }
  const filePath = path.join(configFolder, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Configuration file not found." });
  }
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error reading configuration file." });
    }
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      res.status(500).json({ error: "Error parsing configuration file." });
    }
  });
});


// ----- Endpoints for WebSocket Data Broadcasting -----

// Create HTTP server and attach WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Broadcast CSV data to all connected WebSocket clients
function broadcastCSVData(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// When a new WebSocket client connects, send the current CSV data
wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');
  fs.readFile(csvFilePath, 'utf8', (err, data) => {
    if (!err) {
      ws.send(data);
    }
  });
});

// Ensure CSV exists before starting the server
createCSVIfNotExists();

// Initialize previous file size
let previousSize = 0;
fs.stat(csvFilePath, (err, stats) => {
  if (!err) {
    previousSize = stats.size;
  }
});

// Watch the CSV file for changes and broadcast only the new data
fs.watch(csvFilePath, (eventType, filename) => {
  if (filename && eventType === 'change') {
    fs.stat(csvFilePath, (err, stats) => {
      if (err) return;
      const newSize = stats.size;
      if (newSize > previousSize) {
        const stream = fs.createReadStream(csvFilePath, { start: previousSize, end: newSize });
        let newData = '';
        stream.on('data', chunk => { newData += chunk; });
        stream.on('end', () => {
          broadcastCSVData(newData);
          previousSize = newSize;
        });
      } else {
        previousSize = newSize;
      }
    });
  }
});

// Start the serial reading process
startSerialReading();

// Start the HTTP server on port 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

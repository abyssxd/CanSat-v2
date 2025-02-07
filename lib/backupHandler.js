const fs = require('fs');
const path = require('path');

const backupFolder = path.join(__dirname, '..', 'backup');
const csvFile = path.join(__dirname, '..', 'sheet.csv');
const kmlFile = path.join(__dirname, '..', 'live_track.kml');

let lastBackupTime = 0;
const BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Create backup copies of CSV and KML files with a timestamped filename,
// throttled to create backups at most every 5 minutes.
function createBackup() {
  const now = Date.now();
  if (now - lastBackupTime < BACKUP_INTERVAL_MS) {
    console.log("Backup skipped: less than 5 minutes since last backup.");
    return;
  }
  lastBackupTime = now;
  
  if (!fs.existsSync(backupFolder)) {
    fs.mkdirSync(backupFolder);
  }
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
  const backupCSV = path.join(backupFolder, `${timestamp}_sheet.csv`);
  const backupKML = path.join(backupFolder, `${timestamp}_live_track.kml`);
  if (fs.existsSync(csvFile)) {
    fs.copyFileSync(csvFile, backupCSV);
  }
  if (fs.existsSync(kmlFile)) {
    fs.copyFileSync(kmlFile, backupKML);
  }
  console.log("Backup files created:", backupCSV, backupKML);
}

// Update backups (overwrite backup files with the current versions)
function updateBackup() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(backupFolder)) {
      fs.mkdirSync(backupFolder);
    }
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    const backupCSV = path.join(backupFolder, `${timestamp}_sheet.csv`);
    const backupKML = path.join(backupFolder, `${timestamp}_live_track.kml`);
    fs.copyFile(csvFile, backupCSV, (err) => {
      if (err) {
        console.error("Error updating CSV backup:", err);
        reject(err);
        return;
      }
      fs.copyFile(kmlFile, backupKML, (err2) => {
        if (err2) {
          console.error("Error updating KML backup:", err2);
          reject(err2);
        } else {
          console.log("Backup files updated.");
          resolve();
        }
      });
    });
  });
}

module.exports = {
  createBackup,
  updateBackup
};

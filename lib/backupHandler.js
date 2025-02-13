const fs = require('fs');
const path = require('path');

// Load backup configuration
const configPath = path.join(__dirname, '..', 'config', 'backup.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const backupFolder = path.join(__dirname, '..', 'backup');
const filesToBackup = config.filesToBackup || [];
const BACKUP_INTERVAL_MS = config.backupInterval || 1000; // Default: 5 minutes

let lastBackupTime = 0;

// Ensure the backup directory exists
if (!fs.existsSync(backupFolder)) {
  fs.mkdirSync(backupFolder);
}

// Create a backup of specified files, throttled by the interval
function createBackup() {
  const now = Date.now();
  if (now - lastBackupTime < BACKUP_INTERVAL_MS) {
    console.log("Backup skipped: Less than interval time since last backup.");
    return;
  }
  lastBackupTime = now;

  const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
  
  filesToBackup.forEach(file => {
    const sourcePath = path.join(__dirname, '..', file);
    const backupPath = path.join(backupFolder, `${timestamp}_${file}`);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, backupPath);
      console.log(`Backup created: ${backupPath}`);
    } else {
      console.warn(`Skipped: File not found - ${sourcePath}`);
    }
  });
}

// Overwrite the latest backups with the current files
function updateBackup() {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');

    filesToBackup.forEach(file => {
      const sourcePath = path.join(__dirname, '..', file);
      const backupPath = path.join(backupFolder, `${timestamp}_${file}`);

      fs.copyFile(sourcePath, backupPath, (err) => {
        if (err) {
          console.error(`Error updating backup for ${file}:`, err);
          reject(err);
        } else {
          console.log(`Backup updated: ${backupPath}`);
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

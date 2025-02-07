// Connect to WebSocket for receiving raw serial data (only new data)
const ws = new WebSocket('ws://localhost:3000/console');

ws.onopen = () => {
  appendLog('WebSocket connection established for raw serial data.');
};

ws.onmessage = event => {
  appendLog(event.data);
};

ws.onerror = error => {
  appendLog('WebSocket error: ' + error);
};

ws.onclose = event => {
  appendLog('WebSocket connection closed (' + event.code + ').');
};

// Append incoming data to the console log area and auto-scroll the container
function appendLog(message) {
  const consoleOutput = document.getElementById("consoleOutput");
  consoleOutput.textContent += message + "\n";
  const consoleArea = document.getElementById("consoleArea");
  consoleArea.scrollTop = consoleArea.scrollHeight;
}

// Download CSV file
document.getElementById("downloadCsvBtn").addEventListener("click", () => {
  window.location.href = "/download/csv";
});

// Download KML file
document.getElementById("downloadKmlBtn").addEventListener("click", () => {
  window.location.href = "/download/kml";
});

// Reset CSV file (with confirmation)
document.getElementById("resetCsvBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to reset the CSV?")) {
    fetch('/reset/csv', { method: 'POST' })
      .then(response => response.text())
      .then(result => {
        appendLog("CSV reset: " + result);
      })
      .catch(error => {
        appendLog("Error resetting CSV: " + error);
      });
  }
});

// Load backups from the server and display in the backups list
function loadBackups() {
  fetch('/backups')
    .then(response => response.json())
    .then(data => {
      const backupList = document.getElementById("backupList");
      backupList.innerHTML = "";
      data.forEach(backup => {
        const li = document.createElement("li");
        // Create a checkbox for selection
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("backupCheckbox");
        checkbox.value = backup.filename;
        
        const span = document.createElement("span");
        span.textContent = backup.filename + " (" + backup.timestamp + ")";
        
        // Download button for backup
        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = "Download";
        downloadBtn.addEventListener("click", () => {
          window.location.href = "/download/backup?file=" + encodeURIComponent(backup.filename);
        });
        
        // Delete button for backup
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => {
          if (confirm("Delete backup " + backup.filename + "?")) {
            fetch('/delete/backup?file=' + encodeURIComponent(backup.filename), { method: 'DELETE' })
              .then(response => response.text())
              .then(result => {
                appendLog("Deleted backup: " + backup.filename);
                loadBackups();
              })
              .catch(error => {
                appendLog("Error deleting backup: " + error);
              });
          }
        });
        
        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(downloadBtn);
        li.appendChild(deleteBtn);
        backupList.appendChild(li);
      });
    })
    .catch(error => {
      appendLog("Error loading backups: " + error);
    });
}

// Load backups when the page loads
loadBackups();

// Select All and Delete Selected functionality
document.getElementById("selectAllBackups").addEventListener("change", function() {
  const checkboxes = document.querySelectorAll(".backupCheckbox");
  checkboxes.forEach(cb => cb.checked = this.checked);
});

document.getElementById("deleteSelectedBtn").addEventListener("click", () => {
  const selected = Array.from(document.querySelectorAll(".backupCheckbox:checked"));
  if (selected.length === 0) {
    alert("No backups selected.");
    return;
  }
  if (confirm("Delete selected backups?")) {
    Promise.all(selected.map(cb => {
      const fileName = cb.value;
      return fetch('/delete/backup?file=' + encodeURIComponent(fileName), { method: 'DELETE' })
        .then(response => response.text())
        .then(result => {
          appendLog("Deleted backup: " + fileName);
        })
        .catch(error => {
          appendLog("Error deleting backup: " + error);
        });
    })).then(() => {
      loadBackups();
    });
  }
});
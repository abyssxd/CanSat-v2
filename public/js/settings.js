document.addEventListener("DOMContentLoaded", async function () {
  const settingsContainer = document.getElementById("settingsContainer");

  // List of JSON config files to load (relative to the project root)
  const jsonFiles = [
    "config/navbar.json",
    "config/graphs.json",
    "config/map.json",
    "config/backup.json",
    "config/csvFields.json",
    "config/gyroscopeModel.json",
    "config/statusCards.json"
  ];

  // Function to load settings for each config file
  async function loadSettings() {
    for (const file of jsonFiles) {
      try {
        const response = await fetch(`../${file}`);
        const data = await response.json();
        createForm(file, data);
      } catch (error) {
        console.error(`Error loading ${file}:`, error);
      }
    }
  }

  // Function to create and display a form for a given JSON file
  function createForm(fileName, jsonData) {
    const section = document.createElement("div");
    section.className = "settings-section";
    const title = fileName.replace("config/", "").replace(".json", "").toUpperCase();
    section.innerHTML = `<h2>${title} Settings</h2>`;

    const form = document.createElement("form");
    form.dataset.file = fileName;
    
    // Recursive function to generate inputs for nested JSON keys
    function generateInput(key, value, path = "") {
      const fullPath = path ? `${path}.${key}` : key;
      let inputField = "";

      if (typeof value === "boolean") {
        inputField = `<input type="checkbox" name="${fullPath}" ${value ? "checked" : ""}>`;
      } else if (typeof value === "number") {
        inputField = `<input type="number" name="${fullPath}" value="${value}">`;
      } else if (typeof value === "object" && value !== null) {
        let innerHTML = `<fieldset><legend>${key}</legend>`;
        for (const subKey in value) {
          innerHTML += generateInput(subKey, value[subKey], fullPath);
        }
        innerHTML += `</fieldset>`;
        inputField = innerHTML;
      } else {
        inputField = `<input type="text" name="${fullPath}" value="${value}">`;
      }

      return `<label>${key}: ${inputField}</label>`;
    }

    // Generate form fields from jsonData
    for (const key in jsonData) {
      form.innerHTML += generateInput(key, jsonData[key]);
    }
    form.innerHTML += `<button type="submit">Save Changes</button><div class="status"></div>`;
    section.appendChild(form);
    settingsContainer.appendChild(section);

    // Form submission handler
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      saveSettings(form);
    });
  }

  // Function to reconstruct JSON from form inputs
  function saveSettings(form) {
    const fileName = form.dataset.file;
    const formData = new FormData(form);
    let jsonData = {};

    // Process each field and rebuild the nested object structure
    for (const [key, value] of formData.entries()) {
      const keys = key.split(".");
      let ref = jsonData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!ref[keys[i]]) {
          ref[keys[i]] = {};
        }
        ref = ref[keys[i]];
      }
      // For checkboxes, the value will be "on" if checked
      if (value === "on") {
        ref[keys[keys.length - 1]] = true;
      } else if (!isNaN(value) && value.trim() !== "") {
        ref[keys[keys.length - 1]] = Number(value);
      } else {
        ref[keys[keys.length - 1]] = value;
      }
    }

    // Post the updated configuration to the server
    fetch("/update-json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: fileName, data: jsonData })
    })
      .then(response => response.json())
      .then(result => {
        const statusDiv = form.querySelector(".status");
        if (result.error) {
          statusDiv.textContent = `Error: ${result.error}`;
          statusDiv.style.color = "#e24a4a";
        } else {
          statusDiv.textContent = "Settings updated successfully!";
          statusDiv.style.color = "#01e774";
        }
      })
      .catch(error => {
        console.error("Error saving settings:", error);
      });
  }

  // Load all settings forms
  loadSettings();

  // Load the navbar dynamically
  async function loadNavbar() {
    try {
      const response = await fetch("../config/navbar.json");
      const data = await response.json();
      const navbar = document.getElementById("navbar");
      navbar.innerHTML = "";
      data.items.forEach(item => {
        if (item.visible) {
          navbar.innerHTML += `<li><a href="${item.link}" ${item.external ? 'target="_blank"' : ''}>${item.name}</a></li>`;
        }
      });
    } catch (error) {
      console.error("Error loading navbar:", error);
    }
  }
  loadNavbar();
});

// Sidebar toggle function
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

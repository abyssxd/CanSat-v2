// Toggle sidebar visibility
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

// Load dashboard configurations for navbar and graphs
async function initializeDashboard() {
  try {
    await loadNavbarConfig();
  } catch (error) {
    console.error("Error loading navbar config:", error);
  }
  
  try {
    await loadGraphsConfig();
  } catch (error) {
    console.error("Error loading graphs config:", error);
  }
  
  // Initialize WebSocket connection or any other global init if needed
  initializeWebSocket();
}

// Load navbar configuration from the server
async function loadNavbarConfig() {
  const response = await fetch("/config/navbar.json");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const navConfig = await response.json();
  const sidebarLinks = document.getElementById("sidebar-links");
  sidebarLinks.innerHTML = "";
  
  // Adjust this if the JSON structure is different. Here, we assume navConfig.navbar is an array.
  if (Array.isArray(navConfig.navbar)) {
    navConfig.navbar.forEach(item => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      li.appendChild(a);
      sidebarLinks.appendChild(li);
    });
  } else {
    console.error("Navbar configuration is missing or invalid.");
  }
}

// Load graphs configuration from the server
async function loadGraphsConfig() {
  const response = await fetch("/config/graphs.json");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const graphConfig = await response.json();
  const chartContainer = document.getElementById("chartContainer");
  chartContainer.innerHTML = "";

  // Assuming graphConfig.graphs is an array of graph definitions
  if (Array.isArray(graphConfig.graphs)) {
    graphConfig.graphs.forEach(graph => {
      if (graph.enabled) {
        const chartDiv = document.createElement("div");
        chartDiv.classList.add("chart");

        const canvas = document.createElement("canvas");
        canvas.id = graph.id;

        const downloadLink = document.createElement("a");
        downloadLink.classList.add("download");
        downloadLink.id = graph.id + "_png";
        downloadLink.textContent = "Download Chart Image";

        chartDiv.appendChild(canvas);
        chartDiv.appendChild(downloadLink);
        chartContainer.appendChild(chartDiv);
      }
    });
  } else {
    console.error("Graphs configuration is missing or invalid.");
  }
}

// Initialize WebSocket connection for live updates
function initializeWebSocket() {
  const ws = new WebSocket(`ws://${window.location.host}`);
  ws.addEventListener("open", () => {
    console.log("WebSocket connection established");
  });
  ws.addEventListener("message", (event) => {
    console.log("WebSocket message received:", event.data);
    // Process CSV data updates as needed
  });
  ws.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });
}

async function loadConfig(path) {
    try {
        const response = await fetch(path);
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${path}:`, error);
        return null;
    }
}

async function initializeStatusPage() {
    const [statusConfig, csvFields] = await Promise.all([
        loadConfig('../config/statusCards.json'),
        loadConfig('../config/csvFields.json')
    ]);

    if (!statusConfig || !statusConfig.statusCards) {
        console.error("Error: Status cards configuration missing or invalid.");
        return;
    }

    if (!csvFields || !csvFields.fields) {
        console.error("Error: CSV fields configuration missing or invalid.");
        return;
    }

    // Create Status Cards Dynamically
    const statusContainer = document.getElementById("statusBlocks");
    statusContainer.innerHTML = "";

    statusConfig.statusCards.forEach(card => {
        if (!card.enabled) return;

        let iconHTML = card.icon ? `<img src="icons/${card.icon}" class="status-icon">` : "";
        let detailsHTML = card.details ? card.details.map(field => `<h4 id="${card.id}_${field}">${field}: --</h4>`).join("") : "<h4>No Data</h4>";

        statusContainer.innerHTML += `
            <div class="block" id="${card.id}Block">
                <div class="blockTitle">
                    ${iconHTML}
                    <h3 id="${card.id}MainStatusText">${card.name}</h3>
                    <h4 class="statusblock" id="${card.id}StatusText">Offline</h4>
                </div>
                <div class="blockBody">
                    <hr>
                    <div id="${card.id}Details">
                        ${detailsHTML}
                    </div>
                </div>
            </div>
        `;
    });

    const ws = new WebSocket('ws://localhost:3000/status');

    ws.onopen = () => console.log('Status WebSocket connection established');
    ws.onerror = error => console.error('Status WebSocket Error:', error);
    ws.onclose = event => console.log('Status WebSocket connection closed', event.code, event.reason);

    ws.onmessage = (event) => {
        const csvData = parseCSV(event.data);
        if (csvData.length === 0) return;
        const latestData = csvData[csvData.length - 1];

        const fieldIndexes = {};
        csvFields.fields.forEach((field, index) => {
            fieldIndexes[field.name] = index;
        });

        statusConfig.statusCards.forEach(card => {
            if (!card.enabled) return;

            if (card.statusLogic) {
                let onlineCount = card.statusLogic.filter(field => latestData[fieldIndexes[field]] == 1).length;
                let totalFields = card.statusLogic.length;
                let statusTextElement = document.getElementById(`${card.id}StatusText`);

                if (onlineCount === totalFields) {
                    statusTextElement.textContent = "Online";
                    statusTextElement.style.backgroundColor = card.statusColors.Online;
                } else if (onlineCount > 0) {
                    statusTextElement.textContent = "Partially Online";
                    statusTextElement.style.backgroundColor = card.statusColors["Partially Online"];
                } else {
                    statusTextElement.textContent = "Offline";
                    statusTextElement.style.backgroundColor = card.statusColors.Offline;
                }
            }

            if (card.statusField) {
                let statusValue = latestData[fieldIndexes[card.statusField]];
                let statusConfig = card.statusValues[statusValue] || { text: "Unknown", color: "#ccc" };
                let statusTextElement = document.getElementById(`${card.id}StatusText`);

                if (statusTextElement) {
                    statusTextElement.textContent = statusConfig.text;
                    statusTextElement.style.backgroundColor = statusConfig.color;
                }
            }

            if (card.details) {
                let detailsHTML = card.details
                    .map(field => `<h4 id="${card.id}_${field}">${field}: ${latestData[fieldIndexes[field]] || "--"}</h4>`)
                    .join("");
                
                document.getElementById(`${card.id}Details`).innerHTML = detailsHTML || "<h4>No Additional Info</h4>";
            }
        });
    };
}

function parseCSV(csvString) {
    const rows = csvString.trim().split(/\r?\n/);
    return rows.map(row => row.split(',').map(cell => cell.trim()));
}

initializeStatusPage().catch(error => console.error(error));

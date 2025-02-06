const ws = new WebSocket(`ws://${window.location.host}`);

ws.onopen = function() {
  console.log("WebSocket connection established.");
};

ws.onmessage = function(event) {
  document.getElementById('dataDisplay').textContent = event.data;
};

ws.onclose = function() {
  console.log("WebSocket connection closed.");
};

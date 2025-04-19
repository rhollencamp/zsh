function connectWebSocket() {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

  console.log(`Connecting to WebSocket server at ${wsUrl}`);

  const socket = new WebSocket(wsUrl);

  socket.onopen = (event) => {
    console.log("WebSocket connection opened:", event);
    // Send a message to the server upon connection
    socket.send("Hello Server!");
  };

  socket.onmessage = (event) => {
    console.log("WebSocket message received:", event.data);
    // Handle incoming messages from the server here
  };

  socket.onclose = (event) => {
    console.log("WebSocket connection closed:", event);
    // Handle connection closing, maybe attempt to reconnect?
  };

  socket.onerror = (error) => {
    console.error("WebSocket error observed:", error);
  };
}

export { connectWebSocket };

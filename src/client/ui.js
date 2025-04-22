import { Modal } from "bootstrap";
import { connectWebSocket } from "./netcode.js";

function init() {
  const welcomeModal = Modal.getOrCreateInstance(
    document.getElementById("welcomeModal"),
  );
  document
    .getElementById("welcomeModalPlayButton")
    .addEventListener("click", () => {
      document.getElementById("welcomeModalPlayButton").disabled = true;
      document.getElementById("welcomeModalPlayButton").textContent =
        "Connecting...";
      connectWebSocket();
    });
  welcomeModal.show();
}

export { init };

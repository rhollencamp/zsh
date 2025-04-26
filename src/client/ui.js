import { Modal } from "bootstrap";
import { connectWebSocket } from "./netcode.js";

function init() {
  Modal.getOrCreateInstance(document.getElementById("welcomeModal")).show();
  document
    .getElementById("welcomeModalPlayButton")
    .addEventListener("click", onWelcomeModalSubmit);
}

function onWelcomeModalSubmit() {
  if (!document.getElementById("welcomeForm").checkValidity()) {
    document.getElementById("welcomeForm").classList.add("was-validated");
  } else {
    document.getElementById("welcomeModalPlayButton").disabled = true;
    document.getElementById("welcomeModalPlayButton").textContent =
      "Connecting...";
    connectWebSocket(document.getElementById("welcomeModalPlayerName").value);
  }
}

export { init };

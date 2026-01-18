import { connectWebSocket } from "./netcode.js";
import { controls } from "./gfx.js";
import { Modal } from "bootstrap";

function init(): void {
  const welcomeModal = document.getElementById("welcomeModal");
  if (welcomeModal) {
    Modal.getOrCreateInstance(welcomeModal).show();
  }

  const playButton = document.getElementById("welcomeModalPlayButton");
  if (playButton) {
    playButton.addEventListener("click", onWelcomeModalSubmit);
  }

  const lockButton = document.getElementById("lockButton");
  if (lockButton) {
    lockButton.addEventListener("click", () => {
      controls.lock();
    });
  }
}

function onWelcomeModalSubmit(): void {
  const form = document.getElementById("welcomeForm") as HTMLFormElement | null;
  const playButton = document.getElementById(
    "welcomeModalPlayButton",
  ) as HTMLButtonElement | null;
  const playerNameInput = document.getElementById(
    "welcomeModalPlayerName",
  ) as HTMLInputElement | null;

  if (!form || !playButton || !playerNameInput) {
    console.error("Required form elements not found");
    return;
  }

  if (!form.checkValidity()) {
    form.classList.add("was-validated");
  } else {
    playButton.disabled = true;
    playButton.textContent = "Connecting...";
    connectWebSocket(playerNameInput.value);
  }
}

export { init };

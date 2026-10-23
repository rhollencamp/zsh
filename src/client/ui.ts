/** "online" joins the server that served the page; "offline" runs one in the page. */
export type PlayMode = "online" | "offline";

/** The join screen. */
export class WelcomeScreen {
  private readonly overlay: HTMLElement;
  private readonly form: HTMLFormElement;
  private readonly nameInput: HTMLInputElement;
  private readonly buttons: Map<PlayMode, HTMLButtonElement>;
  private readonly labels = new Map<HTMLButtonElement, string>();
  private readonly error: HTMLElement;

  /** Buttons for modes not in `modes` are removed from the page. */
  constructor(doc: Document, modes: readonly PlayMode[]) {
    this.overlay = byId(doc, "welcome");
    this.form = byId(doc, "welcome-form");
    this.nameInput = byId(doc, "player-name");
    this.error = byId(doc, "welcome-error");
    this.buttons = new Map();
    for (const button of this.form.querySelectorAll<HTMLButtonElement>(
      "button[data-mode]",
    )) {
      const mode = button.dataset.mode as PlayMode;
      if (modes.includes(mode)) {
        this.buttons.set(mode, button);
        this.labels.set(button, button.textContent ?? "");
      } else {
        // removed rather than hidden: Enter submits with the first button
        button.remove();
      }
    }
    if (this.buttons.size === 1) {
      const [button] = this.buttons.values();
      button.textContent = "Play";
      button.classList.remove("secondary");
      this.labels.set(button, "Play");
    }
  }

  onPlay(callback: (name: string, mode: PlayMode) => void): void {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const submitter = event.submitter as HTMLButtonElement | null;
      const mode = (submitter?.dataset.mode ??
        this.buttons.keys().next().value) as PlayMode;
      this.setConnecting(mode);
      callback(this.nameInput.value.trim(), mode);
    });
  }

  setConnecting(mode?: PlayMode): void {
    this.error.hidden = true;
    for (const [buttonMode, button] of this.buttons) {
      button.disabled = true;
      if (buttonMode === mode) {
        button.textContent = mode === "offline" ? "Starting…" : "Connecting…";
      }
    }
  }

  showError(message: string): void {
    this.overlay.hidden = false;
    this.error.textContent = message;
    this.error.hidden = false;
    for (const button of this.buttons.values()) {
      button.disabled = false;
      button.textContent = this.labels.get(button) ?? "";
    }
    this.nameInput.focus();
  }

  hide(): void {
    this.overlay.hidden = true;
    this.nameInput.blur();
  }
}

function byId<T extends HTMLElement>(doc: Document, id: string): T {
  const element = doc.getElementById(id);
  if (element === null) {
    throw new Error(`missing #${id}`);
  }
  return element as T;
}

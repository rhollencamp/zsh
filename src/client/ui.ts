/** The join screen. */
export class WelcomeScreen {
  private readonly overlay: HTMLElement;
  private readonly form: HTMLFormElement;
  private readonly nameInput: HTMLInputElement;
  private readonly button: HTMLButtonElement;
  private readonly error: HTMLElement;

  constructor(doc: Document) {
    this.overlay = byId(doc, "welcome");
    this.form = byId(doc, "welcome-form");
    this.nameInput = byId(doc, "player-name");
    this.button = byId(doc, "play-button");
    this.error = byId(doc, "welcome-error");
  }

  onPlay(callback: (name: string) => void): void {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      callback(this.nameInput.value.trim());
    });
  }

  setConnecting(): void {
    this.error.hidden = true;
    this.button.disabled = true;
    this.button.textContent = "Connecting…";
  }

  showError(message: string): void {
    this.overlay.hidden = false;
    this.error.textContent = message;
    this.error.hidden = false;
    this.button.disabled = false;
    this.button.textContent = "Play";
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

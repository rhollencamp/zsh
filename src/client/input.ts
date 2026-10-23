type Action = "forward" | "back" | "left" | "right";

const BINDINGS: Readonly<Record<string, Action>> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

export interface MoveIntent {
  forward: number;
  right: number;
}

/** Tracks which movement keys are held. */
export class KeyboardInput {
  private readonly held = new Set<Action>();

  /** Returns whether the key is bound, so callers can preventDefault. */
  keyDown(code: string): boolean {
    const action = BINDINGS[code];
    if (action !== undefined) {
      this.held.add(action);
    }
    return action !== undefined;
  }

  keyUp(code: string): void {
    const action = BINDINGS[code];
    if (action !== undefined) {
      this.held.delete(action);
    }
  }

  clear(): void {
    this.held.clear();
  }

  intent(): MoveIntent {
    return {
      forward: Number(this.held.has("forward")) - Number(this.held.has("back")),
      right: Number(this.held.has("right")) - Number(this.held.has("left")),
    };
  }

  /** Listen on a window; returns a function that stops listening. */
  attach(target: Window): () => void {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextField(event.target)) {
        return;
      }
      if (this.keyDown(event.code)) {
        event.preventDefault();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => this.keyUp(event.code);
    const onBlur = () => this.clear();
    target.addEventListener("keydown", onKeyDown);
    target.addEventListener("keyup", onKeyUp);
    target.addEventListener("blur", onBlur);
    return () => {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
      target.removeEventListener("blur", onBlur);
    };
  }
}

function isTextField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
  );
}

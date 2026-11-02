import { useSyncExternalStore } from "react";

interface ToastAction {
  label: string;
  run: () => void;
}

interface Message {
  text: string;
  action?: ToastAction;
}

const EMPTY: Message = { text: "" };
const DURATION_MS = 3200;
const ACTION_DURATION_MS = 7000;

let message = EMPTY;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

function dismiss() {
  message = EMPTY;
  emit();
}

export function toast(text: string, action?: ToastAction) {
  message = { text, action };
  emit();
  clearTimeout(hideTimer);
  hideTimer = setTimeout(dismiss, action ? ACTION_DURATION_MS : DURATION_MS);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function Toaster() {
  const { text, action } = useSyncExternalStore(subscribe, () => message);
  return (
    <div className={`toast ${text ? "on" : ""}`} role="status">
      {text}
      {action && (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            action.run();
            dismiss();
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

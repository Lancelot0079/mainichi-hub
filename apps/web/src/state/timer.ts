import { BLOCKS, type BlockId } from "@mainichi/core";
import { useSyncExternalStore } from "react";
import { toast } from "../ui/toast";
import { addBlockMinutes } from "./actions";

interface Running {
  block: BlockId;
  startedAt: number;
  endsAt: number;
  secondsLeft: number;
}

/** Lives outside React so a running timer survives moving between pages. */
let running: Running | null = null;
let interval: ReturnType<typeof setInterval> | undefined;
let audio: AudioContext | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

function chime() {
  try {
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    setTimeout(() => (oscillator.frequency.value = 660), 180);
    setTimeout(() => oscillator.stop(), 420);
  } catch {
    // Sound is a nicety; the toast still announces the end.
  }
}

function clear() {
  clearInterval(interval);
  running = null;
  emit();
}

function tick() {
  if (!running) return;
  const left = Math.ceil((running.endsAt - Date.now()) / 1000);
  if (left > 0) {
    if (left !== running.secondsLeft) {
      running = { ...running, secondsLeft: left };
      emit();
    }
    return;
  }
  const block = BLOCKS.find((b) => b.id === running?.block);
  clear();
  if (block) {
    addBlockMinutes(block.id, block.minutes, true);
    chime();
    toast(`${block.title}: ¡hecho! +${block.minutes} min`);
  }
}

export function stopTimer(save = true) {
  if (!running) return;
  const { block, startedAt } = running;
  const minutes = Math.floor((Date.now() - startedAt) / 60_000);
  clear();
  if (save && minutes >= 1) {
    addBlockMinutes(block, minutes, false);
    toast(`${minutes} min guardados.`);
  }
}

export function startTimer(block: BlockId) {
  const target = BLOCKS.find((b) => b.id === block);
  if (!target) return;
  try {
    audio ??= new AudioContext();
  } catch {
    audio = null;
  }
  stopTimer();
  const startedAt = Date.now();
  const seconds = target.minutes * 60;
  running = { block, startedAt, endsAt: startedAt + seconds * 1000, secondsLeft: seconds };
  interval = setInterval(tick, 250);
  emit();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useTimer = () => useSyncExternalStore(subscribe, () => running);

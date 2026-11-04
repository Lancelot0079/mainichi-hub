import { useEffect, useState } from "react";

/** Reading aloud uses the device's own Japanese voice, so nothing leaves the browser. */

const synth = () => (typeof speechSynthesis === "undefined" ? null : speechSynthesis);

const japaneseVoice = () =>
  synth()
    ?.getVoices()
    .find((v) => v.lang.toLowerCase().startsWith("ja"));

/** Whether this device has a Japanese voice; voices often load after the page. */
export function useJapaneseVoice(): boolean {
  const [available, setAvailable] = useState(() => !!japaneseVoice());
  useEffect(() => {
    const s = synth();
    if (!s) return;
    const onChange = () => setAvailable(!!japaneseVoice());
    s.addEventListener("voiceschanged", onChange);
    onChange();
    return () => s.removeEventListener("voiceschanged", onChange);
  }, []);
  return available;
}

export function speak(text: string) {
  const s = synth();
  const voice = japaneseVoice();
  if (!s || !voice) return;
  s.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/〜/g, ""));
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 0.85;
  s.speak(utterance);
}

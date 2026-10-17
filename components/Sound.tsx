"use client";

import { useEffect, useState } from "react";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { playPress, playRelease, setSound, soundOn, SOUND_EVENT } from "@/lib/click";

// Every brick button on the page clicks: one delegated listener, no per-button wiring.
export function ClickSounds() {
  useEffect(() => {
    let pressed: Element | null = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pressed = (e.target as Element | null)?.closest(".brick-btn") ?? null;
      if (pressed) playPress();
    };
    const up = () => {
      if (pressed) playRelease();
      pressed = null;
    };
    const key = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && (e.target as Element | null)?.closest(".brick-btn")) {
        playPress();
        setTimeout(playRelease, 70);
      }
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      document.removeEventListener("keydown", key);
    };
  }, []);
  return null;
}

export function SoundToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(soundOn());
    const sync = (e: Event) => setOn((e as CustomEvent<boolean>).detail);
    window.addEventListener(SOUND_EVENT, sync);
    return () => window.removeEventListener(SOUND_EVENT, sync);
  }, []);

  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={on}
      aria-label={on ? "Mute button clicks" : "Turn on button clicks"}
      title={on ? "Click sounds on" : "Click sounds off"}
      onClick={() => {
        const next = !on;
        setSound(next);
        if (next) playPress();
      }}
    >
      {on ? <SpeakerHigh size={20} weight="bold" /> : <SpeakerSlash size={20} weight="bold" />}
    </button>
  );
}

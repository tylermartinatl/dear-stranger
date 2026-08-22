"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import RoyalTypewriter from "./RoyalTypewriter";

const CHARACTERS_PER_LINE = 42;
const CARRIAGE_STEP_DURATION = 64;
const CARRIAGE_RETURN_DURATION = 470;
const KEY_AUDIO_POOL_SIZE = 10;

type ReturnSoundStep = {
  delay: number;
  playbackRate: number;
  volume: number;
};

const RETURN_SOUND_STEPS: ReturnSoundStep[] = [
  { delay: 0, playbackRate: 0.68, volume: 0.11 },
  { delay: 82, playbackRate: 0.74, volume: 0.1 },
  { delay: 164, playbackRate: 0.8, volume: 0.09 },
  { delay: 246, playbackRate: 0.86, volume: 0.08 },
  { delay: 398, playbackRate: 0.92, volume: 0.27 },
];

export default function Home() {
  const [lines, setLines] = useState<string[]>([""]);
  const [carriagePosition, setCarriagePosition] = useState(0);
  const [strikeId, setStrikeId] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const [returning, setReturning] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const linesRef = useRef<string[]>([""]);
  const columnRef = useRef(0);
  const keyAudioPool = useRef<HTMLAudioElement[]>([]);
  const keyAudioIndex = useRef(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnSoundTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const publishLines = useCallback((next: string[]) => {
    linesRef.current = next;
    setLines(next);
  }, []);

  const playMechanicalSound = useCallback(
    (playbackRate: number, volume: number) => {
      const pool = keyAudioPool.current;
      if (pool.length === 0) return;

      const sound = pool[keyAudioIndex.current % pool.length];
      keyAudioIndex.current += 1;
      sound.pause();
      sound.currentTime = 0;
      sound.playbackRate = playbackRate;
      sound.volume = volume;
      void sound.play().catch(() => undefined);
    },
    [],
  );

  const playKeySound = useCallback(() => {
    playMechanicalSound(0.96 + Math.random() * 0.08, 0.24);
  }, [playMechanicalSound]);

  const playCarriageReturnSound = useCallback(() => {
    for (const timer of returnSoundTimers.current) clearTimeout(timer);
    const [firstStep, ...remainingSteps] = RETURN_SOUND_STEPS;
    playMechanicalSound(firstStep.playbackRate, firstStep.volume);
    returnSoundTimers.current = remainingSteps.map((step) =>
      setTimeout(
        () => playMechanicalSound(step.playbackRate, step.volume),
        step.delay,
      ),
    );
  }, [playMechanicalSound]);

  const triggerAdvance = useCallback(() => {
    setAdvancing(true);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(
      () => setAdvancing(false),
      CARRIAGE_STEP_DURATION,
    );
  }, []);

  const strike = useCallback(() => {
    setStrikeId((previous) => previous + 1);
    playKeySound();
  }, [playKeySound]);

  const carriageReturn = useCallback(() => {
    const next = [...linesRef.current, ""];
    publishLines(next);
    columnRef.current = 0;
    setAdvancing(false);
    setReturning(true);
    setCarriagePosition(0);
    playCarriageReturnSound();

    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (returnTimer.current) clearTimeout(returnTimer.current);
    returnTimer.current = setTimeout(
      () => setReturning(false),
      CARRIAGE_RETURN_DURATION,
    );
  }, [playCarriageReturnSound, publishLines]);

  const typeCharacter = useCallback(
    (character: string) => {
      if (!character) return;

      const wrapped = columnRef.current >= CHARACTERS_PER_LINE;
      if (wrapped) carriageReturn();
      else {
        setReturning(false);
        if (returnTimer.current) clearTimeout(returnTimer.current);
      }

      const next = [...linesRef.current];
      next[next.length - 1] += character;
      publishLines(next);

      columnRef.current += 1;
      setCarriagePosition(columnRef.current);
      triggerAdvance();
      if (character !== " ") strike();
    },
    [carriageReturn, publishLines, strike, triggerAdvance],
  );

  const backspace = useCallback(() => {
    const next = [...linesRef.current];
    const current = next[next.length - 1];
    if (current.length === 0) return;

    next[next.length - 1] = current.slice(0, -1);
    columnRef.current = Math.max(0, columnRef.current - 1);
    publishLines(next);
    setReturning(false);
    setCarriagePosition(columnRef.current);
    triggerAdvance();
  }, [publishLines, triggerAdvance]);

  useEffect(() => {
    keyAudioPool.current = Array.from(
      { length: KEY_AUDIO_POOL_SIZE },
      () => {
        const sound = new Audio("/typewriter-key.mp3");
        sound.preload = "auto";
        return sound;
      },
    );

    return () => {
      for (const sound of keyAudioPool.current) sound.pause();
      for (const timer of returnSoundTimers.current) clearTimeout(timer);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (returnTimer.current) clearTimeout(returnTimer.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches(
          "textarea, input, button, select, [contenteditable='true']",
        )
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || aboutOpen) return;

      if (event.key === "Enter") {
        event.preventDefault();
        carriageReturn();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
      } else if (event.key.length === 1) {
        event.preventDefault();
        const character = event.key === " " ? " " : event.key.toUpperCase();
        typeCharacter(character);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aboutOpen, backspace, carriageReturn, typeCharacter]);

  return (
    <main className="homepage">
      <header className="homepage-header">
        <h1>A QUIET EXCHANGE?</h1>
        <button className="about-link" onClick={() => setAboutOpen(true)}>
          About
        </button>
      </header>

      <section
        className="machine-stage"
        aria-label="Interactive virtual typewriter"
      >
        <RoyalTypewriter
          advancing={advancing}
          carriagePosition={carriagePosition}
          lines={lines}
          returning={returning}
          strikeId={strikeId}
        />

        <textarea
          id="letter-input"
          className="keyboard-catcher"
          aria-label="Type your letter"
          value=""
          onChange={(event) => {
            for (const inputCharacter of event.currentTarget.value) {
              if (inputCharacter === "\n") carriageReturn();
              else {
                const character =
                  inputCharacter === " " ? " " : inputCharacter.toUpperCase();
                typeCharacter(character);
              }
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              carriageReturn();
            } else if (event.key === "Backspace") {
              event.preventDefault();
              backspace();
            }
          }}
        />
      </section>

      {aboutOpen ? (
        <div className="about-backdrop">
          <section
            className="about-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-heading"
          >
            <button
              className="about-close"
              onClick={() => setAboutOpen(false)}
              aria-label="Close About"
            >
              ×
            </button>
            <h2 id="about-heading">A quiet exchange.</h2>
            <p>
              Write one honest letter today. Tomorrow, receive a little advice,
              wisdom, or kindness from someone you have never met.
            </p>
          </section>
        </div>
      ) : null}
    </main>
  );
}

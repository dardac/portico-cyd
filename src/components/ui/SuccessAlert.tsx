"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const DEFAULT_DURATION_MS = 3500;
const DEFAULT_FADE_MS = 500;

type SuccessAlertProps = {
  show: boolean;
  children: ReactNode;
  onHidden?: () => void;
  className?: string;
  duration?: number;
  fadeDuration?: number;
  autoDismiss?: boolean;
};

export function SuccessAlert({
  show,
  children,
  onHidden,
  className = "",
  duration = DEFAULT_DURATION_MS,
  fadeDuration = DEFAULT_FADE_MS,
  autoDismiss = true,
}: SuccessAlertProps) {
  const [displayed, setDisplayed] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const onHiddenRef = useRef(onHidden);
  const displayedRef = useRef(false);
  const fadeTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onHiddenRef.current = onHidden;
  }, [onHidden]);

  useEffect(() => {
    function clearTimers() {
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    }

    function finishHide() {
      displayedRef.current = false;
      setDisplayed(false);
      setIsFading(false);
      onHiddenRef.current?.();
    }

    function startFadeOut() {
      setIsFading(true);
      hideTimerRef.current = window.setTimeout(finishHide, fadeDuration);
    }

    if (!show) {
      clearTimers();
      if (displayedRef.current) {
        startFadeOut();
      }
      return clearTimers;
    }

    displayedRef.current = true;
    setDisplayed(true);
    setIsFading(false);
    clearTimers();

    if (!autoDismiss) {
      return clearTimers;
    }

    fadeTimerRef.current = window.setTimeout(startFadeOut, duration);

    return clearTimers;
  }, [show, children, duration, fadeDuration, autoDismiss]);

  if (!displayed) return null;

  return (
    <div
      role="status"
      className={`alert-success ${isFading ? "alert-success-exit" : ""} ${className}`.trim()}
      style={
        {
          "--alert-fade-duration": `${fadeDuration}ms`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

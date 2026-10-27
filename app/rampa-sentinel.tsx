"use client";

import { useEffect, useRef, useState } from "react";
import { RAMPA_PRINCIPAL, RAMPA_WARN, insideRampCorridor } from "./rampas";

const DWELL_MS = 3 * 60 * 1000;

function notifyRamp() {
  if (typeof Notification === "undefined") return;
  const send = () => {
    try {
      new Notification("Corredor da rampa", { body: RAMPA_WARN, tag: RAMPA_PRINCIPAL.id });
    } catch {
      /* the phone refused the banner */
    }
  };
  if (Notification.permission === "granted") send();
  else if (Notification.permission === "default") {
    void Notification.requestPermission().then((result) => {
      if (result === "granted") send();
    });
  }
}

export function useRampWatch(mapOpen: boolean) {
  const [alert, setAlert] = useState(false);
  const dismissed = useRef(false);
  const notified = useRef(false);
  const lingering = useRef(false);
  const insideSince = useRef<number | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        if (position.coords.accuracy > 40) return;
        const here = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (!insideRampCorridor(here)) {
          insideSince.current = null;
          lingering.current = false;
          dismissed.current = false;
          notified.current = false;
          setAlert(false);
          return;
        }
        const now = Date.now();
        if (insideSince.current == null) insideSince.current = now;
        if (now - insideSince.current < DWELL_MS) return;
        lingering.current = true;
        if (!dismissed.current) setAlert(true);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  useEffect(() => {
    if (mapOpen || !lingering.current || notified.current || dismissed.current) return;
    notified.current = true;
    notifyRamp();
  }, [mapOpen, alert]);

  return {
    alert,
    dismiss() {
      dismissed.current = true;
      setAlert(false);
    },
  };
}

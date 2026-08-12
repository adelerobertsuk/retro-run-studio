import { useEffect, useState } from "react";

function fromTimeZone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const city = tz.split("/").pop();
    if (city) return city.replace(/_/g, " ").toUpperCase();
  } catch {
    /* ignore */
  }
  return "NEON DISTRICT";
}

/**
 * Best-effort city label for the hero viewport badge. Uses GPS reverse
 * geocoding when the user has granted permission, otherwise falls back to
 * the device time zone.
 */
export function useLocationLabel() {
  const [label, setLabel] = useState("NEON DISTRICT");

  useEffect(() => {
    let active = true;
    setLabel(fromTimeZone());
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
          );
          if (!res.ok) return;
          const data = (await res.json()) as { city?: string; locality?: string };
          const city = data.city || data.locality;
          if (active && city) setLabel(city.toUpperCase());
        } catch {
          /* keep fallback */
        }
      },
      () => {
        /* permission denied — keep fallback */
      },
      { timeout: 8000, maximumAge: 600000 },
    );

    return () => {
      active = false;
    };
  }, []);

  return label;
}

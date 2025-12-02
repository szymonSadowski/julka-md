"use client";

import { useEffect } from "react";

export function PWAInstaller() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;
    let updateInterval: NodeJS.Timeout | null = null;

    const registerSW = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
        console.log("SW registered: ", registration);

        // Check for updates periodically
        updateInterval = setInterval(() => {
          if (registration && registration.active) {
            registration.update().catch((err) => {
              console.log("SW update check failed: ", err);
            });
          }
        }, 60000); // Check every minute
      } catch (error) {
        console.log("SW registration failed: ", error);
      }
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
    }

    // Cleanup on unmount
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, []);

  return null;
}

"use client";

import { useState, useEffect, useRef } from 'react';

const VIDEO_URL = 'http://192.168.29.210:8080/video.cgi';
const DISPLAY_DURATION_MS = 30000; // 30 seconds
const POLLING_INTERVAL_MS = 2000; // 2 seconds

interface DoorbellEvent {
  timestamp: string;
}

export default function DoorbellOverlay() {
  const [isShowing, setIsShowing] = useState(false);
  const lastEventTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    const pollForDoorbellEvent = async () => {
      try {
        // Add a cache-busting query parameter to prevent the browser from serving a stale file
        const response = await fetch(`/api/doorbell.json?t=${new Date().getTime()}`);
        if (!response.ok) {
          // The file might not exist yet, which is fine.
          return;
        }

        const data: DoorbellEvent = await response.json();
        const newTimestamp = data.timestamp;

        // If we have a new, valid timestamp and the overlay is not already showing
        if (newTimestamp && newTimestamp !== lastEventTimestampRef.current && !isShowing) {
          console.log(`New doorbell event detected: ${newTimestamp}`);
          lastEventTimestampRef.current = newTimestamp;
          setIsShowing(true);

          // Set a timer to hide the overlay after 30 seconds
          setTimeout(() => {
            setIsShowing(false);
            console.log('Doorbell overlay hidden.');
          }, DISPLAY_DURATION_MS);
        }
      } catch (error) {
        // Silently fail if JSON is invalid or network error
      }
    };

    const intervalId = setInterval(pollForDoorbellEvent, POLLING_INTERVAL_MS);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [isShowing]); // Re-run effect dependencies on `isShowing` to stop polling while active

  if (!isShowing) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="w-full h-full max-w-4xl max-h-4xl aspect-video bg-black">
        <iframe
          src={VIDEO_URL}
          title="Doorbell Camera"
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media"
        />
      </div>
    </div>
  );
}

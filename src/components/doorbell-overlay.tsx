"use client";

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const VIDEO_URL = 'http://192.168.29.210:8080/video.cgi';
const DISPLAY_DURATION_MS = 30000; // 30 seconds

const getWsUrl = () => {
  if (typeof window === 'undefined') {
    return 'ws://localhost:3001'; // Default for non-browser environments
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Always connect to the root path for WebSocket
  return `${protocol}//${window.location.host}`;
};

export default function DoorbellOverlay() {
  const [isShowing, setIsShowing] = useState(false);
  const isShowingRef = useRef(isShowing);
  isShowingRef.current = isShowing;
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  
  const hideOverlay = async () => {
    setIsShowing(false);
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    // Release the wake lock when the overlay is hidden
    if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock released.');
    }
    console.log('Doorbell overlay hidden.');
  };

  const connect = () => {
    const WS_URL = getWsUrl();
    console.log(`Connecting to WebSocket at ${WS_URL}...`);
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket connected.');
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.current.onmessage = async (event) => {
      if (event.data === 'doorbell-ring') {
        if (!isShowingRef.current) {
          console.log('New doorbell event received via WebSocket.');
          setIsShowing(true);

          // Request a wake lock when the overlay is shown
          if ('wakeLock' in navigator) {
            try {
              wakeLockRef.current = await navigator.wakeLock.request('screen');
              console.log('Wake Lock acquired.');
            } catch (err: any) {
              console.error(`${err.name}, ${err.message}`);
            }
          }

          // Set a timer to hide the overlay after 30 seconds
          hideTimer.current = setTimeout(() => {
            hideOverlay();
          }, DISPLAY_DURATION_MS);
        } else {
            console.log('Doorbell event received but overlay is already showing.');
        }
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected. Attempting to reconnect in 5 seconds...');
      if (!reconnectTimer.current) {
        reconnectTimer.current = setTimeout(connect, 5000);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.current?.close();
    };
  };

  useEffect(() => {
    connect();

    const handleVisibilityChange = async () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible' && isShowingRef.current) {
        try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            console.log('Wake Lock re-acquired after visibility change.');
        } catch (err: any) {
            console.error(`${err.name}, ${err.message}`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on component unmount
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      ws.current?.close();
    };
  }, []);

  if (!isShowing) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
      <div className="relative w-full h-full flex items-center justify-center">
        <img
            src={VIDEO_URL}
            alt="Doorbell Camera"
            className="max-w-full max-h-full object-contain"
        />
        <button
          onClick={hideOverlay}
          className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/75 transition-colors z-10"
          aria-label="Close doorbell video"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

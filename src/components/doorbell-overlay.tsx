"use client";

import { useState, useEffect, useRef } from 'react';

const VIDEO_URL = 'http://192.168.29.210:8080/video.cgi';
const DISPLAY_DURATION_MS = 30000; // 30 seconds

const getWsUrl = () => {
  if (typeof window === 'undefined') {
    return 'ws://localhost:3001'; // Default for non-browser environments
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:3001`;
};

export default function DoorbellOverlay() {
  const [isShowing, setIsShowing] = useState(false);
  const isShowingRef = useRef(isShowing);
  isShowingRef.current = isShowing;
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

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

    ws.current.onmessage = (event) => {
      if (event.data === 'doorbell-ring') {
        // If the overlay is not already showing, show it.
        if (!isShowingRef.current) {
          console.log('New doorbell event received via WebSocket.');
          setIsShowing(true);

          // Set a timer to hide the overlay after 30 seconds
          setTimeout(() => {
            setIsShowing(false);
            console.log('Doorbell overlay hidden.');
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
      ws.current?.close(); // This will trigger the onclose event and reconnection logic
    };
  };

  useEffect(() => {
    connect();

    // Cleanup on component unmount
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      ws.current?.close();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

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

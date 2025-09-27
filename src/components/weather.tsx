"use client";

import { useEffect, useState } from 'react';

interface WeatherData {
  temp: number;
  description: string;
  aqi: number;
}

const getAqiInfo = (aqi: number): { text: string, color: string } => {
    switch (aqi) {
        case 1: return { text: 'Good', color: 'text-green-400' };
        case 2: return { text: 'Fair', color: 'text-yellow-400' };
        case 3: return { text: 'Moderate', color: 'text-orange-400' };
        case 4: return { text: 'Poor', color: 'text-red-500' };
        case 5: return { text: 'Very Poor', color: 'text-purple-500' };
        default: return { text: 'N/A', color: 'text-white/50' };
    }
};


export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        const data = await response.json();
        setWeather(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      }
    };

    fetchWeather();
    // Fetch weather every minute
    const interval = setInterval(fetchWeather, 60 * 1000); 

    return () => clearInterval(interval);
  }, []);

  if (error || !weather) {
    return <div className="text-sm text-white/50 h-5 capitalize">{error ? 'Weather unavailable' : ''}</div>;
  }
  
  const aqiInfo = getAqiInfo(weather.aqi);

  return (
    <div className="text-base md:text-lg text-white/80 mt-1 capitalize flex items-center gap-4">
       <span>{weather.temp}°C, {weather.description}</span>
       <span className={aqiInfo.color}>AQI: {aqiInfo.text}</span>
    </div>
  );
}

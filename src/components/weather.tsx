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

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const [weatherResponse, airPollutionResponse] = await Promise.all([
          fetch('/api/weather'),
          fetch('/api/air_pollution')
        ]);
        
        if (!weatherResponse.ok || !airPollutionResponse.ok) {
          console.error('Failed to fetch weather data');
          setWeather(null);
          return;
        }

        const weatherData = await weatherResponse.json();
        const airPollutionData = await airPollutionResponse.json();

        setWeather({
          temp: Math.round(weatherData.main.temp),
          description: weatherData.weather[0]?.description || 'N/A',
          aqi: airPollutionData.list[0]?.main.aqi || 0,
        });
      } catch (err: any) {
        console.error('Error fetching weather data:', err);
        setWeather(null);
      }
    };

    fetchWeather();
    // Fetch weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); 

    return () => clearInterval(interval);
  }, []);

  if (!weather) {
    return <div className="h-5" />; // Return an empty div with a fixed height to prevent layout shifts
  }
  
  const aqiInfo = getAqiInfo(weather.aqi);

  return (
    <div className="text-base md:text-lg text-white/80 mt-1 capitalize flex items-center gap-4">
       <span><span className="font-bold">{weather.temp}°C</span>, {weather.description}</span>
       <span className={aqiInfo.color}><span className="font-bold">AQI: {weather.aqi} ({aqiInfo.text})</span></span>
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const lat = process.env.NEXT_PUBLIC_LATITUDE;
  const lon = process.env.NEXT_PUBLIC_LONGITUDE;

  if (!apiKey || !lat || !lon) {
    return new NextResponse('Weather API environment variables are not configured.', { status: 500 });
  }

  try {
    // Fetch weather and air pollution data in parallel
    const [weatherResponse, airPollutionResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
      fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
    ]);

    if (!weatherResponse.ok) {
      const errorBody = await weatherResponse.text();
      throw new Error(`Failed to fetch weather data: ${weatherResponse.status} ${weatherResponse.statusText}. Body: ${errorBody}`);
    }
    if (!airPollutionResponse.ok) {
        const errorBody = await airPollutionResponse.text();
        throw new Error(`Failed to fetch air pollution data: ${airPollutionResponse.status} ${airPollutionResponse.statusText}. Body: ${errorBody}`);
    }

    const weatherData = await weatherResponse.json();
    const airPollutionData = await airPollutionResponse.json();

    const combinedData = {
      temp: Math.round(weatherData.main.temp),
      description: weatherData.weather[0]?.description || 'N/A',
      aqi: airPollutionData.list[0]?.main.aqi || 0,
    };

    return NextResponse.json(combinedData);

  } catch (error: any) {
    console.error('Error fetching weather data:', error);
    return new NextResponse(`Internal server error while fetching weather data: ${error.message}`, { status: 500 });
  }
}

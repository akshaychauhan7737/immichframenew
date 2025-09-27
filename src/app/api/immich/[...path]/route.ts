import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const immichApiUrl = process.env.NEXT_PUBLIC_IMMICH_API_URL;
  const immichApiKey = process.env.NEXT_PUBLIC_IMMICH_API_KEY;

  if (!immichApiUrl || !immichApiKey) {
    return new NextResponse('Immich server environment variables are not configured.', { status: 500 });
  }

  const searchParams = request.nextUrl.search;
  const targetUrl = `${immichApiUrl}/api/${path}${searchParams}`;
  
  try {
    const apiResponse = await fetch(targetUrl, {
      headers: {
        'x-api-key': immichApiKey,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      return new NextResponse(`Failed to fetch from Immich API: ${apiResponse.status} ${apiResponse.statusText}. Body: ${errorBody}`, {
        status: apiResponse.status,
      });
    }

    const data = await apiResponse.json();
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching from Immich API:', error);
    return new NextResponse('Internal server error while fetching from Immich API.', { status: 500 });
  }
}

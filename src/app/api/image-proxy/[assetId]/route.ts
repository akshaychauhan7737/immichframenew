import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  const { assetId } = params;
  const immichApiUrl = process.env.NEXT_PUBLIC_IMMICH_API_URL;
  const immichApiKey = process.env.NEXT_PUBLIC_IMMICH_API_KEY;

  if (!immichApiUrl || !immichApiKey) {
    return new NextResponse('Immich server environment variables are not configured.', { status: 500 });
  }

  const searchParams = request.nextUrl.search;
  const imageUrl = `${immichApiUrl}/api/assets/${assetId}/thumbnail${searchParams}`;
  
  try {
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'x-api-key': immichApiKey,
      },
      cache: 'no-store', // Avoid caching this proxy response
    });

    if (!imageResponse.ok) {
      const errorBody = await imageResponse.text();
      return new NextResponse(`Failed to fetch image from Immich: ${imageResponse.status} ${imageResponse.statusText}. Body: ${errorBody}`, {
        status: imageResponse.status,
      });
    }

    const imageBlob = await imageResponse.blob();
    const headers = new Headers();
    headers.set('Content-Type', imageResponse.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Content-Length', imageResponse.headers.get('Content-Length') || imageBlob.size.toString());

    return new NextResponse(imageBlob, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error fetching image from Immich:', error);
    return new NextResponse('Internal server error while fetching image.', { status: 500 });
  }
}

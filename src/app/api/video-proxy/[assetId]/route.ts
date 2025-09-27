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

  // Construct the video playback URL
  const searchParams = request.nextUrl.search;
  const videoUrl = `${immichApiUrl}/api/assets/${assetId}/video/playback${searchParams}`;
  
  try {
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'x-api-key': immichApiKey,
        // Forward range headers if they exist to support video seeking
        ...(request.headers.has('range') && { 'range': request.headers.get('range')! }),
      },
      cache: 'no-store',
    });

    if (!videoResponse.ok) {
      const errorBody = await videoResponse.text();
      return new NextResponse(`Failed to fetch video from Immich: ${videoResponse.status} ${videoResponse.statusText}. Body: ${errorBody}`, {
        status: videoResponse.status,
      });
    }

    // Stream the video content back to the client
    const headers = new Headers();
    headers.set('Content-Type', videoResponse.headers.get('Content-Type') || 'video/mp4');
    headers.set('Content-Length', videoResponse.headers.get('Content-Length') || '0');
    headers.set('Accept-Ranges', videoResponse.headers.get('Accept-Ranges') || 'bytes');
    if (videoResponse.headers.has('Content-Range')) {
        headers.set('Content-Range', videoResponse.headers.get('Content-Range')!);
    }
    
    // For range requests, the status code should be 206
    const status = videoResponse.status === 206 ? 206 : 200;

    return new NextResponse(videoResponse.body, {
      status,
      headers,
    });

  } catch (error) {
    console.error('Error fetching video from Immich:', error);
    return new NextResponse('Internal server error while fetching video.', { status: 500 });
  }
}

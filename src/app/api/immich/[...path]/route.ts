import { NextRequest } from "next/server";

const IMMICH_API_URL = process.env.IMMICH_API_URL;
const IMMICH_API_KEY = process.env.IMMICH_API_KEY;

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  if (!IMMICH_API_URL || !IMMICH_API_KEY) {
    return new Response("Immich server is not configured.", { status: 500 });
  }

  const assetPath = params.path.join("/");
  const searchParams = req.nextUrl.search;
  const immichUrl = `${IMMICH_API_URL}/api/${assetPath}${searchParams}`;

  const headers = new Headers();
  headers.set("x-api-key", IMMICH_API_KEY);

  // Pass through range headers for video streaming
  const range = req.headers.get("range");
  if (range) {
    headers.set("range", range);
  }

  try {
    const immichResponse = await fetch(immichUrl, {
      headers,
      cache: "force-cache", // Assets are immutable, cache them aggressively
    });

    if (!immichResponse.ok) {
      return new Response(immichResponse.statusText, {
        status: immichResponse.status,
      });
    }

    // Create a new response, passing through the body and relevant headers
    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Length",
      immichResponse.headers.get("Content-Length") || "0"
    );
    responseHeaders.set(
      "Content-Type",
      immichResponse.headers.get("Content-Type") || "application/octet-stream"
    );
    
    // For video streaming
    if (immichResponse.headers.has("Content-Range")) {
      responseHeaders.set("Content-Range", immichResponse.headers.get("Content-Range")!);
    }
    if (immichResponse.headers.has("Accept-Ranges")) {
      responseHeaders.set("Accept-Ranges", immichResponse.headers.get("Accept-Ranges")!);
    }
    

    return new Response(immichResponse.body, {
      status: immichResponse.status,
      statusText: immichResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error proxying to Immich:", error);
    return new Response("Error proxying request to Immich.", { status: 500 });
  }
}

import "server-only";
import { ImmichAsset, ImmichAssetsResponse, ImmichBucket } from "./types";

const IMMICH_API_URL = process.env.IMMICH_API_URL;
const IMMICH_API_KEY = process.env.IMMICH_API_KEY;

if (!IMMICH_API_URL || !IMMICH_API_KEY) {
  console.error("Immich API URL or Key is not configured in environment variables.");
}

const headers = {
  "x-api-key": IMMICH_API_KEY!,
  "Accept": "application/json",
};

export async function getBuckets(): Promise<ImmichBucket[]> {
  if (!IMMICH_API_URL || !IMMICH_API_KEY) {
    throw new Error("Server not configured for Immich API.");
  }
  try {
    const response = await fetch(
      `${IMMICH_API_URL}/api/timeline/buckets?visibility=timeline&withPartners=true&withStacked=true`,
      { headers, cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch buckets: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching Immich buckets:", error);
    return [];
  }
}

export async function getAssetsForBucket(bucket: string): Promise<ImmichAsset[]> {
  if (!IMMICH_API_URL || !IMMICH_API_KEY) {
    throw new Error("Server not configured for Immich API.");
  }
  try {
    const url = `${IMMICH_API_URL}/api/timeline/bucket?timeBucket=${encodeURIComponent(
      `${bucket}T00:00:00.000Z`
    )}&visibility=timeline&withPartners=true&withStacked=true`;
    
    const response = await fetch(url, { headers, cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch assets for bucket ${bucket}: ${response.statusText}`);
    }
    
    const data: ImmichAssetsResponse = await response.json();
    
    // The API returns an object of arrays, so we need to transform it
    const assets: ImmichAsset[] = data.id.map((id, index) => ({
      id,
      fileCreatedAt: data.fileCreatedAt[index],
      isFavorite: data.isFavorite[index],
      isImage: data.isImage[index],
      duration: data.duration[index],
      thumbhash: data.thumbhash[index],
      livePhotoVideoId: data.livePhotoVideoId[index],
    }));

    return assets;
  } catch (error) {
    console.error(`Error fetching assets for bucket ${bucket}:`, error);
    return [];
  }
}

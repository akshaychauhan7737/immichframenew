import type { ImmichAsset, ImmichBucket, ImmichAssetsResponse } from "./types";

const IMMICH_API_KEY = process.env.NEXT_PUBLIC_IMMICH_API_KEY;

// The API URL is now relative to our own server, which will proxy to the real Immich API
const API_BASE_PATH = "/api/immich/api";

async function immichFetch(path: string) {
    if (!IMMICH_API_KEY) {
        throw new Error("Immich API Key is not configured in environment variables.");
    }
    const headers = {
        "x-api-key": IMMICH_API_KEY!,
        "Accept": "application/json",
    };
    // Construct the full URL to our local proxy
    const url = `${API_BASE_PATH}${path}`;

    const response = await fetch(url, { headers, cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Immich API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function getBuckets(): Promise<ImmichBucket[]> {
    return immichFetch("/timeline/buckets?visibility=timeline&withPartners=true&withStacked=true");
}

export async function getAssetsForBucket(bucket: string): Promise<ImmichAsset[]> {
    const path = `/timeline/bucket?timeBucket=${encodeURIComponent(
        `${bucket}T00:00:00.000Z`
    )}&visibility=timeline&withPartners=true&withStacked=true`;
    
    const data: ImmichAssetsResponse = await immichFetch(path);
    
    // The Immich API returns a non-standard structure, so we normalize it here.
    if (!data.id || !Array.isArray(data.id)) return [];

    const assets: ImmichAsset[] = data.id.map((id: string, index: number) => ({
      id,
      fileCreatedAt: data.fileCreatedAt[index],
      isFavorite: data.isFavorite[index],
      isImage: data.isImage[index],
      duration: data.duration[index],
      thumbhash: data.thumbhash[index],
      livePhotoVideoId: data.livePhotoVideoId[index],
    }));

    return assets;
}


export async function getNextBucketAssets(bucket: string): Promise<ImmichAsset[]> {
    return getAssetsForBucket(bucket);
}

export function getAssetUrl(assetId: string, type: 'thumbnail' | 'video'): string {
    const endpoint = type === 'video' ? 'playback' : 'thumbnail';
    const params = type === 'thumbnail' ? '?size=preview' : '';
    // The asset URLs are constructed to go through the proxy as well
    return `${API_BASE_PATH}/asset/${assetId}${params}`;
}
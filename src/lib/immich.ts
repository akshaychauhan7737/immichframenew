import type { ImmichAsset, ImmichBucket, ImmichAssetsResponse } from "./types";

const IMMICH_API_URL = process.env.NEXT_PUBLIC_IMMICH_API_URL;
const IMMICH_API_KEY = process.env.NEXT_PUBLIC_IMMICH_API_KEY;

function checkConfig() {
    if (!IMMICH_API_URL || !IMMICH_API_KEY) {
        throw new Error("Immich API URL or Key is not configured in environment variables.");
    }
}

async function immichFetch(url: string) {
    checkConfig();
    const headers = {
        "x-api-key": IMMICH_API_KEY!,
        "Accept": "application/json",
    };
    const response = await fetch(url, { headers, cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Immich API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function getBuckets(): Promise<ImmichBucket[]> {
    const url = `${IMMICH_API_URL}/api/timeline/buckets?visibility=timeline&withPartners=true&withStacked=true`;
    return immichFetch(url);
}

export async function getAssetsForBucket(bucket: string): Promise<ImmichAsset[]> {
    const url = `${IMMICH_API_URL}/api/timeline/bucket?timeBucket=${encodeURIComponent(
        `${bucket}T00:00:00.000Z`
    )}&visibility=timeline&withPartners=true&withStacked=true`;
    
    const data: ImmichAssetsResponse = await immichFetch(url);
    
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
    if (!IMMICH_API_URL) return "";
    const endpoint = type === 'video' ? 'video/playback' : 'thumbnail?size=preview';
    return `${IMMICH_API_URL}/api/asset/${assetId}/${endpoint}`;
}

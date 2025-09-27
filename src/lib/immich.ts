import type { ImmichAsset, ImmichBucket, ImmichAssetsResponse } from "./types";

const IMMICH_API_URL = process.env.NEXT_PUBLIC_IMMICH_API_URL;
const IMMICH_API_KEY = process.env.NEXT_PUBLIC_IMMICH_API_KEY;

// Helper to check if we are on the server
const isServer = typeof window === 'undefined';

async function immichFetch(path: string, options: RequestInit = {}) {
    if (!IMMICH_API_KEY || !IMMICH_API_URL) {
        throw new Error("Immich API URL or Key is not configured in environment variables.");
    }

    // If on the server, fetch directly from the Immich instance.
    // If on the client, use the Next.js API proxy to hide the key.
    const baseUrl = isServer ? `${IMMICH_API_URL}/api` : "/api/immich";
    const url = `${baseUrl}${path}`;

    const headers = {
        "Accept": "application/json",
        // The API key is only sent for direct server-to-server requests.
        // The browser client relies on the proxy, which adds the key.
        ...(isServer && { "x-api-key": IMMICH_API_KEY }),
        ...options.headers,
    };
    
    const response = await fetch(url, { ...options, headers, cache: "no-store" });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Immich API request failed: ${response.status} ${response.statusText}. Body: ${errorBody}`);
    }
    return response.json();
}

export async function getBuckets(): Promise<ImmichBucket[]> {
    return immichFetch("/timeline/buckets?visibility=timeline&withPartners=true&withStacked=true");
}

export async function getAssetsForBucket(bucket: string): Promise<ImmichAsset[]> {
    const path = `/timeline/bucket?timeBucket=${encodeURIComponent(bucket)}`;
    const data: any = await immichFetch(path);

    // Handle columnar/SoA format vs standard array of objects/AoS format
    if (data && Array.isArray(data.id) && !data.items) {
        const assets: ImmichAsset[] = [];
        const count = data.id.length;
        for (let i = 0; i < count; i++) {
            assets.push({
                id: data.id[i],
                fileCreatedAt: data.fileCreatedAt[i],
                isFavorite: data.isFavorite[i],
                type: data.isImage[i] ? 'IMAGE' : 'VIDEO',
                duration: data.duration[i],
                thumbhash: data.thumbhash[i],
                livePhotoVideoId: data.livePhotoVideoId[i],
            });
        }
        return assets;
    }

    // Handle standard AoS format
    const responseData = data as ImmichAssetsResponse;
    if (!responseData || !Array.isArray(responseData.items)) {
        return [];
    }
    return responseData.items.map(item => ({
        ...item,
        type: item.type === 'VIDEO' ? 'VIDEO' : 'IMAGE'
    }));
}

export async function getAssetById(assetId: string): Promise<ImmichAsset> {
    const asset = await immichFetch(`/assets/${assetId}`);
    return {
        ...asset,
        type: asset.type === 'VIDEO' ? 'VIDEO' : 'IMAGE'
    };
}


export async function getNextBucketAssets(bucket: string): Promise<ImmichAsset[]> {
    return getAssetsForBucket(bucket);
}

export function getImageUrl(asset: ImmichAsset): string {
    if (asset.type !== 'IMAGE') return "";
    let params = `?size=preview`;
    return `/api/image-proxy/${asset.id}${params}`;
}

export function getVideoUrl(asset: ImmichAsset): string {
    if (asset.type !== 'VIDEO') return "";
    return `/api/video-proxy/${asset.id}`;
}

export function getThumbnailUrl(asset: ImmichAsset): string {
    let params = `?size=preview`;
    if (asset.thumbhash) {
        params += `&thumbhash=${encodeURIComponent(asset.thumbhash)}`;
    }
    return `/api/image-proxy/${asset.id}${params}`;
}

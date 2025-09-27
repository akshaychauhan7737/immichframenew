import type { ImmichAsset, ImmichBucket, ImmichAssetsResponse } from "./types";

const IMMICH_API_KEY = process.env.NEXT_PUBLIC_IMMICH_API_KEY;
const API_BASE_PATH = "/api/immich";

async function immichFetch(path: string, options: RequestInit = {}) {
    if (!IMMICH_API_KEY) {
        throw new Error("Immich API Key is not configured in environment variables.");
    }
    const headers = {
        "x-api-key": IMMICH_API_KEY!,
        "Accept": "application/json",
        ...options.headers,
    };
    const url = `${API_BASE_PATH}${path}`;

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
    const data: ImmichAssetsResponse = await immichFetch(path);
    return data.items.map(item => ({
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

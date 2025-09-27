"use server";

import { getAssetsForBucket, getBuckets } from "@/lib/immich";
import { ImmichAsset, ImmichBucket } from "@/lib/types";

export async function getSlideshowData(): Promise<{ buckets: ImmichBucket[], assets: ImmichAsset[] }> {
  const buckets = await getBuckets();

  if (!buckets || buckets.length === 0) {
    return { buckets: [], assets: [] };
  }

  const firstBucket = buckets[0];
  const assets = await getAssetsForBucket(firstBucket.timeBucket);
  
  return { buckets, assets };
}

export async function getNextBucketAssets(bucket: string): Promise<ImmichAsset[]> {
    return await getAssetsForBucket(bucket);
}
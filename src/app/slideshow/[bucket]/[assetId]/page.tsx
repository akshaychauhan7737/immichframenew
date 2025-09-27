import SlideshowClient from "@/components/slideshow-client";
import { getAssetsForBucket, getBuckets } from "@/lib/immich";
import { notFound } from "next/navigation";

type AssetPageProps = {
  params: {
    bucket: string;
    assetId: string;
  };
};

export default async function AssetPage({ params }: AssetPageProps) {
  const { bucket, assetId } = params;
  const allBuckets = await getBuckets();
  const allAssetsInBucket = await getAssetsForBucket(bucket);

  const currentAsset = allAssetsInBucket.find((a) => a.id === assetId);

  if (!currentAsset) {
    notFound();
  }

  return (
    <SlideshowClient
      buckets={allBuckets}
      currentBucket={bucket}
      assets={allAssetsInBucket}
      currentAsset={currentAsset}
    />
  );
}

export async function generateStaticParams() {
  const buckets = await getBuckets();
  const params = [];

  for (const bucket of buckets.slice(0, 3)) { // Limit for build-time generation
    const assets = await getAssetsForBucket(bucket.timeBucket);
    for (const asset of assets.slice(0, 10)) { // Limit for build-time generation
      params.push({ bucket: bucket.timeBucket, assetId: asset.id });
    }
  }

  return params;
}

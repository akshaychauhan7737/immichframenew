"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { format } from "date-fns";

import SlideshowClient from "@/components/slideshow-client";
import type { ImmichAsset, ImmichBucket } from "@/lib/types";
import { getBuckets, getAssetsForBucket } from "@/lib/immich";


export default function SlideshowLoader() {
  const [data, setData] = useState<{
    buckets: ImmichBucket[];
    assets: ImmichAsset[];
    bucketIndex: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let retryTimeout: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const buckets = await getBuckets();
        if (isCancelled) return;

        if (!buckets || buckets.length === 0) {
          throw new Error("No buckets found or failed to connect to Immich.");
        }
        
        // Find the first non-empty bucket
        let firstAssets: ImmichAsset[] = [];
        let firstBucketIndex = 0;
        for (let i = 0; i < buckets.length; i++) {
            const assets = await getAssetsForBucket(buckets[i].timeBucket);
            if (isCancelled) return;
            if (assets.length > 0) {
                firstAssets = assets;
                firstBucketIndex = i;
                break;
            }
        }
        
        if (firstAssets.length === 0) {
            throw new Error("No assets found in any available buckets.");
        }

        setData({ buckets, assets: firstAssets, bucketIndex: firstBucketIndex });
        setError(null);
      } catch (e: any) {
        if (isCancelled) return;
        setError(e.message || "An unknown error occurred.");
        // Retry after 3 seconds
        retryTimeout = setTimeout(fetchData, 3000);
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
      clearTimeout(retryTimeout);
    };
  }, []);

  if (error && !data) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col">
         <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="flex flex-col items-center justify-center text-center p-4">
                <LoaderCircle className="w-12 h-12 text-white/50 animate-spin mb-4" />
                <h2 className="text-2xl font-semibold">Connecting to Immich...</h2>
                <p className="mt-2 text-muted-foreground">
                    Could not connect or find any photos. Retrying...
                </p>
                <p className="mt-1 text-sm text-red-400">
                    Error: {error}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                    Please check your environment variables and ensure your Immich server is running and contains photos.
                </p>
            </div>
        </div>
        <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div>
            <h3 className="font-bold">{format(now, "MMMM d, yyyy")}</h3>
            <p className="text-sm text-white/80">{format(now, "h:mm:ss a")}</p>
          </div>
        </footer>
      </div>
    );
  }

  if (!data) {
    return (
       <div className="fixed inset-0 bg-black text-white flex flex-col">
         <div className="flex-1 flex items-center justify-center min-h-0">
            <LoaderCircle className="w-12 h-12 text-white/50 animate-spin" />
        </div>
        <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div>
            <h3 className="font-bold">{format(now, "MMMM d, yyyy")}</h3>
            <p className="text-sm text-white/80">{format(now, "h:mm:ss a")}</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <SlideshowClient
      initialBuckets={data.buckets}
      initialAssets={data.assets}
      initialBucketIndex={data.bucketIndex}
    />
  );
}

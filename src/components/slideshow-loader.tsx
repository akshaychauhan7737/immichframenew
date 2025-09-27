"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { format } from "date-fns";

import SlideshowClient from "@/components/slideshow-client";
import type { ImmichAsset, ImmichBucket } from "@/lib/types";
import { getBuckets, getAssetsForBucket } from "@/lib/immich";

const STORAGE_KEY = "slideshow_state";

interface SlideshowState {
  bucketTime: string;
  assetId: string;
}

export default function SlideshowLoader() {
  const [data, setData] = useState<{
    buckets: ImmichBucket[];
    assets: ImmichAsset[];
    bucketIndex: number;
    assetIndex: number;
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
        // 1. Get all available buckets
        const buckets = await getBuckets();
        if (isCancelled || !buckets || buckets.length === 0) {
          throw new Error("No buckets found or failed to connect to Immich.");
        }

        // 2. Check for a saved state in localStorage
        const savedStateJSON = localStorage.getItem(STORAGE_KEY);
        let savedState: SlideshowState | null = null;
        if (savedStateJSON) {
          try {
            savedState = JSON.parse(savedStateJSON);
          } catch (e) {
            console.error("Failed to parse saved state, starting over.", e);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        
        let initialAssets: ImmichAsset[] = [];
        let initialBucketIndex = -1;
        let initialAssetIndex = 0;

        // 3. Try to resume from saved state
        if (savedState) {
            const resumeBucketIndex = buckets.findIndex(b => b.timeBucket === savedState!.bucketTime);
            if (resumeBucketIndex !== -1) {
                const assets = await getAssetsForBucket(buckets[resumeBucketIndex].timeBucket);
                if (!isCancelled && assets.length > 0) {
                    const resumeAssetIndex = assets.findIndex(a => a.id === savedState!.assetId);
                    if (resumeAssetIndex !== -1) {
                        initialAssets = assets;
                        initialBucketIndex = resumeBucketIndex;
                        initialAssetIndex = resumeAssetIndex;
                    }
                }
            }
             // If resuming fails for any reason, clear saved state and start fresh
            if (initialBucketIndex === -1) {
                localStorage.removeItem(STORAGE_KEY);
            }
        }


        // 4. If not resuming, find the first non-empty bucket to start
        if (initialBucketIndex === -1) {
            for (let i = 0; i < buckets.length; i++) {
                const assets = await getAssetsForBucket(buckets[i].timeBucket);
                if (isCancelled) return;
                if (assets.length > 0) {
                    initialAssets = assets;
                    initialBucketIndex = i;
                    break;
                }
            }
        }

        if (initialAssets.length === 0) {
            throw new Error("No assets found in any available buckets.");
        }

        setData({ buckets, assets: initialAssets, bucketIndex: initialBucketIndex, assetIndex: initialAssetIndex });
        setError(null);
      } catch (e: any) {
        if (isCancelled) return;
        setError(e.message || "An unknown error occurred.");
        // Retry after 5 seconds
        retryTimeout = setTimeout(fetchData, 5000);
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
        <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between p-4 md:p-6 bg-gradient-to-t from-black/50 to-transparent">
            <div>
              <h3 className="font-bold text-lg md:text-xl text-white/90">
                {format(now, "EEEE, MMMM d")}
              </h3>
            </div>
            <div className="text-right">
                <h3 className="font-bold text-5xl md:text-7xl leading-none whitespace-nowrap">
                  {format(now, "h:mm")}
                  <span className="text-2xl md:text-4xl text-white/80 align-baseline ml-2">{format(now, "a")}</span>
                </h3>
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
        <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between p-4 md:p-6 bg-gradient-to-t from-black/50 to-transparent">
            <div>
              <h3 className="font-bold text-lg md:text-xl text-white/90">
                {format(now, "EEEE, MMMM d")}
              </h3>
            </div>
            <div className="text-right">
                <h3 className="font-bold text-5xl md:text-7xl leading-none whitespace-nowrap">
                  {format(now, "h:mm")}
                  <span className="text-2xl md:text-4xl text-white/80 align-baseline ml-2">{format(now, "a")}</span>
                </h3>
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
      initialAssetIndex={data.assetIndex}
    />
  );
}

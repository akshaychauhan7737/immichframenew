"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { format } from "date-fns";

import SlideshowClient from "@/components/slideshow-client";
import type { ImmichAsset, ImmichBucket } from "@/lib/types";
import Weather from "./weather";

const STORAGE_KEY = "slideshow_state";

interface SlideshowState {
  bucketTime: string;
  assetId: string;
}

// Helper functions to fetch data from API routes
async function getBuckets(): Promise<ImmichBucket[]> {
  const res = await fetch('/api/immich/timeline/buckets?visibility=timeline&withPartners=true&withStacked=true');
  if (!res.ok) throw new Error("Failed to fetch buckets");
  return res.json();
}

async function getAssetsForBucket(bucket: string): Promise<ImmichAsset[]> {
    const res = await fetch(`/api/immich/timeline/bucket?timeBucket=${encodeURIComponent(bucket)}`);
    if (!res.ok) throw new Error("Failed to get assets for bucket");
    const data = await res.json();

    // Handle columnar format from some Immich versions
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
    // Handle object array format
    return data?.items || [];
}

interface SlideshowLoaderProps {
    bucket?: string; // Optional starting bucket
}

export default function SlideshowLoader({ bucket: startBucket }: SlideshowLoaderProps) {
  const [data, setData] = useState<{
    buckets: ImmichBucket[];
    assets: ImmichAsset[];
    bucketIndex: number;
    assetIndex: number;
    duration: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Only run this effect on the client
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let retryTimeout: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const durationEnv = process.env.NEXT_PUBLIC_SLIDESHOW_DURATION_S;
        const duration = durationEnv ? parseInt(durationEnv, 10) : 12;
        
        // 1. Get all available buckets
        const buckets = await getBuckets();
        if (isCancelled || !buckets || buckets.length === 0) {
          throw new Error("No buckets found or failed to connect to Immich.");
        }

        let initialAssets: ImmichAsset[] = [];
        let initialBucketIndex = -1;
        let initialAssetIndex = 0;

        // 2. If a specific start bucket is provided, use it
        if (startBucket) {
            const startBucketIndex = buckets.findIndex(b => b.timeBucket === startBucket);
            if (startBucketIndex !== -1) {
                const assets = await getAssetsForBucket(buckets[startBucketIndex].timeBucket);
                if (!isCancelled && assets.length > 0) {
                    initialAssets = assets;
                    initialBucketIndex = startBucketIndex;
                    initialAssetIndex = 0;
                }
            }
        } else {
            // 3. Try to resume from saved state in localStorage
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
        
        if (isCancelled) return;
        setData({ buckets, assets: initialAssets, bucketIndex: initialBucketIndex, assetIndex: initialAssetIndex, duration });
        setError(null);
      } catch (e: any) {
        if (isCancelled) return;
        setError(e.message || "An unknown error occurred.");
        // Retry after 5 seconds if we haven't successfully loaded data yet
        if (!data) { 
          retryTimeout = setTimeout(fetchData, 5000);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
      clearTimeout(retryTimeout);
    };
  }, [startBucket]); // Removed `data` from dependencies to prevent re-fetching on success

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col">
         <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="flex flex-col items-center justify-center text-center p-4">
                <LoaderCircle className="w-12 h-12 text-white/50 animate-spin mb-4" />
                {error && <p className="mt-2 text-muted-foreground">Connecting to Immich...</p>}
            </div>
        </div>
        {now && <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between p-4 md:p-6 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex flex-col">
              <div className="font-bold text-lg md:text-xl text-white/90 flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span>{format(now, "EEEE,")}</span>
                <span>{format(now, "MMMM d")}</span>
              </div>
              <Weather />
            </div>
            <div className="text-right">
                <h3 className="font-bold text-5xl sm:text-6xl md:text-7xl leading-none whitespace-nowrap">
                  {format(now, "h:mm")}
                  <span className="text-2xl sm:text-3xl md:text-4xl text-white/80 align-baseline ml-2">{format(now, "a")}</span>
                </h3>
            </div>
        </footer>}
      </div>
    );
  }

  return (
    <SlideshowClient
      initialBuckets={data.buckets}
      initialAssets={data.assets}
      initialBucketIndex={data.bucketIndex}
      initialAssetIndex={data.assetIndex}
      duration={data.duration}
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { format } from "date-fns";

import SlideshowClient from "@/components/slideshow-client";
import type { ImmichAsset, ImmichBucket } from "@/lib/types";

const IMMICH_API_URL = process.env.NEXT_PUBLIC_IMMICH_API_URL;
const IMMICH_API_KEY = process.env.NEXT_PUBLIC_IMMICH_API_KEY;

async function getBuckets(): Promise<ImmichBucket[]> {
    if (!IMMICH_API_URL || !IMMICH_API_KEY) {
      throw new Error("Server not configured for Immich API.");
    }
    const headers = {
      "x-api-key": IMMICH_API_KEY!,
      "Accept": "application/json",
    };
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

async function getAssetsForBucket(bucket: string): Promise<ImmichAsset[]> {
    if (!IMMICH_API_URL || !IMMICH_API_KEY) {
      throw new Error("Server not configured for Immich API.");
    }
    const headers = {
        "x-api-key": IMMICH_API_KEY!,
        "Accept": "application/json",
    };
    try {
      const url = `${IMMICH_API_URL}/api/timeline/bucket?timeBucket=${encodeURIComponent(
        `${bucket}T00:00:00.000Z`
      )}&visibility=timeline&withPartners=true&withStacked=true`;
      
      const response = await fetch(url, { headers, cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch assets for bucket ${bucket}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
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
    } catch (error) {
      console.error(`Error fetching assets for bucket ${bucket}:`, error);
      return [];
    }
}


export default function SlideshowLoader() {
  const [data, setData] = useState<{
    buckets: ImmichBucket[];
    assets: ImmichAsset[];
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
        if (!IMMICH_API_URL || !IMMICH_API_KEY) {
          throw new Error("Immich API URL or Key is not configured in environment variables.");
        }
        
        const buckets = await getBuckets();
        if (isCancelled) return;

        if (!buckets || buckets.length === 0) {
          throw new Error("No buckets found or failed to connect.");
        }
        
        const firstBucket = buckets[0];
        const assets = await getAssetsForBucket(firstBucket.timeBucket);

        if (isCancelled) return;

        if (assets.length === 0) {
            throw new Error("No assets found in the first bucket.");
        }

        setData({ buckets, assets });
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
                    Could not connect to Immich. Retrying...
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Please check your environment variables and ensure your Immich server is running.
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
    />
  );
}

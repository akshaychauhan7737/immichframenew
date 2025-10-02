"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { LoaderCircle, MapPin } from "lucide-react";

import type { ImmichAsset, ImmichBucket } from "@/lib/types";
import Weather from "./weather";

const VIDEO_TIMEOUT_S = 60; // Max time to wait for a video to load/play
const STORAGE_KEY = "slideshow_state";

// Helper functions to fetch data from the API routes
async function getNextBucketAssets(bucket: string): Promise<ImmichAsset[]> {
    const res = await fetch(`/api/immich/timeline/bucket?timeBucket=${encodeURIComponent(bucket)}`);
    if (!res.ok) throw new Error("Failed to get next bucket assets");
    const data = await res.json();
    // Handle columnar vs object array format
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
    return data?.items || [];
}

async function getAssetById(assetId: string): Promise<ImmichAsset | null> {
    try {
        const res = await fetch(`/api/immich/assets/${assetId}`);
        if (!res.ok) throw new Error(`Failed to get asset ${assetId}`);
        const asset = await res.json();
        return {
            ...asset,
            type: asset.type === 'VIDEO' ? 'VIDEO' : 'IMAGE'
        };
    } catch (error) {
        console.error("Error in getAssetById:", error);
        return null;
    }
}

// Helper functions to construct media URLs using the proxy
const getImageUrl = (asset: ImmichAsset) => `/api/immich/assets/${asset.id}/thumbnail?size=preview`;
const getThumbnailUrl = (asset: ImmichAsset) => `/api/immich/assets/${asset.id}/thumbnail?size=preview${asset.thumbhash ? `&thumbhash=${encodeURIComponent(asset.thumbhash)}` : ''}`;
const getVideoUrl = (asset: ImmichAsset) => `/api/immich/assets/${asset.id}/video/playback`;


interface SlideshowClientProps {
    initialBuckets: ImmichBucket[];
    initialAssets: ImmichAsset[];
    initialBucketIndex: number;
    initialAssetIndex: number;
    duration: number;
}

export default function SlideshowClient({
  initialBuckets,
  initialAssets,
  initialBucketIndex,
  initialAssetIndex,
  duration,
}: SlideshowClientProps) {
  const [buckets] = useState<ImmichBucket[]>(initialBuckets);
  const [currentBucketIndex, setCurrentBucketIndex] = useState(initialBucketIndex);
  const [assets, setAssets] = useState<ImmichAsset[]>(initialAssets);
  const [currentAssetIndex, setCurrentAssetIndex] = useState(initialAssetIndex);
  const [detailedAsset, setDetailedAsset] = useState<ImmichAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Clock effect
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentAsset = useMemo(() => assets[currentAssetIndex], [assets, currentAssetIndex]);
  const currentBucket = useMemo(() => buckets[currentBucketIndex], [buckets, currentBucketIndex]);

  // Save state to localStorage whenever the asset or bucket changes
  useEffect(() => {
    if (currentBucket && currentAsset) {
      const state = {
        bucketTime: currentBucket.timeBucket,
        assetId: currentAsset.id,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [currentBucket, currentAsset]);


  // Fetch detailed asset info when currentAsset changes
  useEffect(() => {
    if (currentAsset) {
      let isCancelled = false;
      const fetchDetails = async () => {
        try {
          const details = await getAssetById(currentAsset.id);
          if (!isCancelled) {
            setDetailedAsset(details);
          }
        } catch (error) {
          console.error("Failed to fetch asset details", error);
          if (!isCancelled) {
            // Fallback to basic asset info if detailed fetch fails
            setDetailedAsset(currentAsset);
          }
        }
      };
      fetchDetails();
      return () => { isCancelled = true; };
    }
  }, [currentAsset]);

  const navigateToNext = useCallback(async () => {
    if (isLoading) return;
  
    setDetailedAsset(null); // Clear details for next asset
  
    if (currentAssetIndex < assets.length - 1) {
      setCurrentAssetIndex(prev => prev + 1);
    } else {
      let nextBucketIndex = currentBucketIndex + 1;
      if (nextBucketIndex >= buckets.length) {
        nextBucketIndex = 0; // Loop back to the first bucket
      }
  
      const nextBucket = buckets[nextBucketIndex];
  
      if (nextBucket) {
        setIsLoading(true);
        try {
          let nextAssets: ImmichAsset[] = [];
          let attempts = 0;
          while (nextAssets.length === 0 && attempts < buckets.length) {
            const bucketToTry = buckets[nextBucketIndex];
            if (bucketToTry) {
              nextAssets = await getNextBucketAssets(bucketToTry.timeBucket);
              if (nextAssets.length > 0) {
                setAssets(nextAssets);
                setCurrentBucketIndex(nextBucketIndex);
                setCurrentAssetIndex(0);
              } else {
                nextBucketIndex = (nextBucketIndex + 1) % buckets.length;
              }
            } else {
              nextBucketIndex = (nextBucketIndex + 1) % buckets.length;
            }
            attempts++;
          }
          if (attempts >= buckets.length) {
            console.error("No assets found in any bucket after full loop.");
          }
        } catch (error) {
          console.error("Failed to load next bucket assets", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [isLoading, currentAssetIndex, assets.length, currentBucketIndex, buckets]);

  // Auto-advance logic for images
  useEffect(() => {
    if (isLoading || !currentAsset || currentAsset.type !== 'IMAGE') return;
    
    const timer = setTimeout(navigateToNext, duration * 1000);
    return () => clearTimeout(timer);
  }, [currentAsset, isLoading, duration, navigateToNext]);

  // Timeout for stuck videos
  useEffect(() => {
    if (isLoading || !currentAsset || currentAsset.type !== 'VIDEO') return;

    const videoStuckTimeout = setTimeout(() => {
        console.warn(`Video stuck for ${VIDEO_TIMEOUT_S}s, advancing...`);
        navigateToNext();
    }, VIDEO_TIMEOUT_S * 1000);

    return () => clearTimeout(videoStuckTimeout);
  }, [currentAsset, isLoading, navigateToNext]);


  // Prefetching logic for next image
  useEffect(() => {
    if (currentAssetIndex < assets.length - 1) {
      const nextAsset = assets[currentAssetIndex + 1];
      if (nextAsset && nextAsset.type === 'IMAGE') { 
        const img = new window.Image();
        img.src = getImageUrl(nextAsset);
      }
    }
  }, [assets, currentAssetIndex]);
  
  const assetDate = currentAsset ? new Date(currentAsset.fileCreatedAt) : new Date();
  const locationParts = [
      detailedAsset?.exifInfo?.city,
      detailedAsset?.exifInfo?.state,
  ].filter(Boolean);
  const locationString = locationParts.join(', ');
  
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6 bg-gradient-to-b from-black/50 to-transparent">
        {currentAsset && (
          <Link href="/launcher" className="cursor-pointer">
            <h3 className="font-bold text-lg md:text-xl text-white/90">{format(assetDate, "MMMM d, yyyy")}</h3>
            {locationString && (
                 <div className="flex items-center gap-2 text-base md:text-lg text-white/80 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{locationString}</span>
                </div>
            )}
          </Link>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {(isLoading && !currentAsset) || !detailedAsset ? (
            <LoaderCircle className="w-12 h-12 text-white/50 animate-spin" />
        ) : (
          <AnimatePresence initial={false}>
            {detailedAsset && (
                <motion.div
                key={detailedAsset.id}
                className="w-full h-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    {detailedAsset.type === 'IMAGE' ? (
                        <Image
                        src={getImageUrl(detailedAsset)}
                        alt={`Asset from ${detailedAsset.fileCreatedAt}`}
                        fill
                        className="object-contain"
                        priority
                        unoptimized
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            src={getVideoUrl(detailedAsset)}
                            poster={getThumbnailUrl(detailedAsset)}
                            autoPlay
                            playsInline
                            muted
                            loop={false}
                            onEnded={navigateToNext}
                            onError={(e) => {
                                console.error("Video playback error", e);
                                navigateToNext();
                            }}
                            className="w-full h-full object-contain"
                        />
                    )}
                </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between p-4 md:p-6 bg-gradient-to-t from-black/50 to-transparent">
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
      </footer>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { LoaderCircle } from "lucide-react";

import type { ImmichAsset, ImmichBucket } from "@/lib/types";
import { getNextBucketAssets, getImageUrl, getVideoUrl, getThumbnailUrl } from "@/lib/immich";

const IMAGE_DURATION_S = parseInt(process.env.NEXT_PUBLIC_SLIDESHOW_DURATION_S || '5', 10);
const VIDEO_TIMEOUT_S = 60; // Max time to wait for a video to load/play

interface SlideshowClientProps {
    initialBuckets: ImmichBucket[];
    initialAssets: ImmichAsset[];
    initialBucketIndex: number;
}

export default function SlideshowClient({
  initialBuckets,
  initialAssets,
  initialBucketIndex,
}: SlideshowClientProps) {
  const [buckets] = useState<ImmichBucket[]>(initialBuckets);
  const [currentBucketIndex, setCurrentBucketIndex] = useState(initialBucketIndex);
  const [assets, setAssets] = useState<ImmichAsset[]>(initialAssets);
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Clock effect
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentAsset = useMemo(() => assets[currentAssetIndex], [assets, currentAssetIndex]);

  const navigateToNext = async () => {
    if (isLoading) return;

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
          while (nextAssets.length === 0) {
            nextAssets = await getNextBucketAssets(buckets[nextBucketIndex].timeBucket);
            if (nextAssets.length > 0) {
                setAssets(nextAssets);
                setCurrentBucketIndex(nextBucketIndex);
                setCurrentAssetIndex(0);
            } else {
                nextBucketIndex = (nextBucketIndex + 1) % buckets.length;
                if (nextBucketIndex === currentBucketIndex) {
                    console.error("No assets found in any bucket.");
                    break;
                }
            }
          }
        } catch (error) {
          console.error("Failed to load next bucket assets", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  // Auto-advance logic for images
  useEffect(() => {
    if (isLoading || !currentAsset || currentAsset.type !== 'IMAGE') return;
    
    const timer = setTimeout(navigateToNext, IMAGE_DURATION_S * 1000);
    return () => clearTimeout(timer);
  }, [currentAsset, isLoading]);

  // Timeout for stuck videos
  useEffect(() => {
    if (isLoading || !currentAsset || currentAsset.type !== 'VIDEO') return;

    const videoStuckTimeout = setTimeout(() => {
        console.warn(`Video stuck for ${VIDEO_TIMEOUT_S}s, advancing...`);
        navigateToNext();
    }, VIDEO_TIMEOUT_S * 1000);

    return () => clearTimeout(videoStuckTimeout);
  }, [currentAsset, isLoading]);


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
  
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between p-4 md:p-6 bg-gradient-to-b from-black/50 to-transparent">
        {currentAsset ? (
          <div>
            <h3 className="font-bold text-lg md:text-xl text-white/90">{format(assetDate, "MMMM d, yyyy")}</h3>
          </div>
        ) : <div />}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {(isLoading && !currentAsset) ? (
            <LoaderCircle className="w-12 h-12 text-white/50 animate-spin" />
        ) : (
          <AnimatePresence initial={false}>
            {currentAsset && (
                <motion.div
                key={currentAsset.id}
                className="w-full h-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    {currentAsset.type === 'IMAGE' ? (
                        <Image
                        src={getImageUrl(currentAsset)}
                        alt={`Asset from ${currentAsset.fileCreatedAt}`}
                        fill
                        className="object-contain"
                        priority
                        unoptimized
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            src={getVideoUrl(currentAsset)}
                            poster={getThumbnailUrl(currentAsset)}
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
        <div>
          {/* This space is intentionally left blank */}
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

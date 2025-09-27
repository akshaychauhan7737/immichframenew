"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { LoaderCircle } from "lucide-react";

import type { ImmichAsset, ImmichBucket } from "@/lib/types";
import { getNextBucketAssets, getAssetUrl } from "@/lib/immich";

const IMAGE_DURATION_S = 5;

type SlideshowClientProps = {
  initialBuckets: ImmichBucket[];
  initialAssets: ImmichAsset[];
  initialBucketIndex: number;
};

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
          // Keep trying buckets until we find one with assets
          let nextAssets: ImmichAsset[] = [];
          while (nextAssets.length === 0) {
            nextAssets = await getNextBucketAssets(buckets[nextBucketIndex].timeBucket);
            if (nextAssets.length > 0) {
                setAssets(nextAssets);
                setCurrentBucketIndex(nextBucketIndex);
                setCurrentAssetIndex(0);
            } else {
                nextBucketIndex = (nextBucketIndex + 1) % buckets.length;
                // If we've looped through all buckets and found nothing, stop.
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

  // Auto-advance logic
  useEffect(() => {
    if (isLoading || !currentAsset) return;

    if (currentAsset.isImage) {
        const timer = setTimeout(navigateToNext, IMAGE_DURATION_S * 1000);
        return () => clearTimeout(timer);
    }
  }, [currentAsset, isLoading]);

  // Prefetching logic for next image
  useEffect(() => {
    if (currentAssetIndex < assets.length - 1) {
      const nextAsset = assets[currentAssetIndex + 1];
      if (nextAsset && nextAsset.isImage) { 
        const img = new window.Image();
        img.src = getAssetUrl(nextAsset, 'thumbnail');
      }
    }
  }, [assets, currentAssetIndex]);
  
  const assetDate = currentAsset ? new Date(currentAsset.fileCreatedAt) : new Date();
  
  const imageSrc = currentAsset ? getAssetUrl(currentAsset, 'thumbnail') : "";

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between p-4 md:p-6 bg-gradient-to-b from-black/50 to-transparent">
        {currentAsset ? (
          <div>
            <h3 className="font-bold text-xl md:text-2xl">{format(assetDate, "MMMM d, yyyy")}</h3>
            <p className="text-lg md:text-xl text-white/80">{format(assetDate, "h:mm a")}</p>
          </div>
        ) : <div />}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {(isLoading && !currentAsset) ? (
            <LoaderCircle className="w-12 h-12 text-white/50 animate-spin" />
        ) : (
          <AnimatePresence initial={false}>
            {currentAsset && currentAsset.isImage && imageSrc && (
                <motion.div
                key={currentAsset.id}
                className="w-full h-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <Image
                    src={imageSrc}
                    alt={`Asset from ${currentAsset.fileCreatedAt}`}
                    fill
                    className="object-contain"
                    priority
                    unoptimized // Using proxy, no need for Next.js optimization
                    />
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

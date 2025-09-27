"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { LoaderCircle, Video } from "lucide-react";

import type { ImmichAsset, ImmichBucket } from "@/lib/types";
import { getNextBucketAssets, getSlideshowData } from "@/app/actions";

type SlideshowClientProps = {
  initialBuckets: ImmichBucket[];
  initialAssets: ImmichAsset[];
};

const IMAGE_DURATION_S = 5;

export default function SlideshowClient({
  initialBuckets,
  initialAssets,
}: SlideshowClientProps) {
  const [buckets, setBuckets] = useState<ImmichBucket[]>(initialBuckets);
  const [currentBucketIndex, setCurrentBucketIndex] = useState(0);
  const [assets, setAssets] = useState<ImmichAsset[]>(initialAssets);
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [now, setNow] = useState(new Date());

  // Clock effect
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentAsset = useMemo(() => assets[currentAssetIndex], [assets, currentAssetIndex]);
  const currentBucket = useMemo(() => buckets[currentBucketIndex], [buckets, currentBucketIndex]);

  const navigateToNext = async () => {
    if (currentAssetIndex < assets.length - 1) {
      setCurrentAssetIndex(prev => prev + 1);
    } else {
      let nextBucketIndex = currentBucketIndex + 1;
      if (nextBucketIndex >= buckets.length) {
        nextBucketIndex = 0; // Loop back to the first bucket
      }
      
      setCurrentBucketIndex(nextBucketIndex);
      const nextBucket = buckets[nextBucketIndex];
      
      if (nextBucket) {
        setIsLoading(true);
        try {
          const nextAssets = await getNextBucketAssets(nextBucket.timeBucket);
          if (nextAssets.length > 0) {
            setAssets(nextAssets);
            setCurrentAssetIndex(0);
          } else {
             // If bucket is empty, try the next one
             navigateToNext();
          }
        } catch (error) {
          console.error("Failed to load next bucket assets", error);
           // If there's an error, try the next one
           navigateToNext();
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const navigateToPrev = () => {
    if (currentAssetIndex > 0) {
      setCurrentAssetIndex(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigateToNext();
      else if (e.key === "ArrowLeft") navigateToPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [assets, currentAssetIndex, buckets, currentBucketIndex]);

  const isVideo = currentAsset?.livePhotoVideoId || (currentAsset && !currentAsset.isImage);

  // Auto-advance logic
  useEffect(() => {
    if (isLoading || !currentAsset) return;

    let timer: NodeJS.Timeout;
    if (isVideo) {
      const videoElement = videoRef.current;
      if (videoElement) {
        const handleVideoEnd = () => navigateToNext();
        videoElement.addEventListener("ended", handleVideoEnd);
        videoElement.play().catch(console.error);
        return () => videoElement.removeEventListener("ended", handleVideoEnd);
      }
    } else {
      timer = setTimeout(navigateToNext, IMAGE_DURATION_S * 1000);
    }
    return () => clearTimeout(timer);
  }, [currentAsset, isLoading]);

  // Prefetching logic
  useEffect(() => {
    const nextAsset = assets[currentAssetIndex + 1];
    if (nextAsset?.isImage) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = `/api/immich/asset/${nextAsset.id}/thumbnail?size=preview`;
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [assets, currentAssetIndex]);
  
  const assetDate = currentAsset ? new Date(currentAsset.fileCreatedAt) : new Date();
  const videoSrc = currentAsset ? `/api/immich/asset/${currentAsset.id}/video/playback` : "";
  const imageSrc = currentAsset ? `/api/immich/asset/${currentAsset.id}/thumbnail?size=preview` : "";

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      {/* Header */}
      {currentAsset && (
        <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div>
            <h3 className="font-bold">{format(assetDate, "MMMM d, yyyy")}</h3>
            <p className="text-sm text-white/80">{format(assetDate, "h:mm a")}</p>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {(isLoading || !currentAsset) ? (
            <LoaderCircle className="w-12 h-12 text-white/50 animate-spin" />
        ) : (
          <AnimatePresence initial={false}>
            <motion.div
              key={currentAsset.id}
              className="w-full h-full flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {isVideo ? (
                <video
                  ref={videoRef}
                  key={currentAsset.id}
                  muted
                  playsInline
                  className="max-h-full max-w-full object-contain"
                >
                  <source src={videoSrc} type="video/mp4" />
                </video>
              ) : (
                <Image
                  src={imageSrc}
                  alt={`Asset from ${currentAsset.fileCreatedAt}`}
                  fill
                  className="object-contain"
                  priority
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-t from-black/50 to-transparent">
        <div>
          <h3 className="font-bold">{format(now, "MMMM d, yyyy")}</h3>
          <p className="text-sm text-white/80">{format(now, "h:mm:ss a")}</p>
        </div>
      </footer>
    </div>
  );
}

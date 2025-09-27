"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X, Video } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { ImmichAsset, ImmichBucket } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';

type SlideshowClientProps = {
  buckets: ImmichBucket[];
  currentBucket: string;
  assets: ImmichAsset[];
  currentAsset: ImmichAsset;
};

const IMAGE_DURATION_S = 5;

export default function SlideshowClient({
  buckets,
  currentBucket,
  assets,
  currentAsset,
}: SlideshowClientProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { currentIndex, nextAsset, prevAsset, nextBucket } = useMemo(() => {
    const currentBucketIndex = buckets.findIndex(b => b.timeBucket === currentBucket);
    const currentIndex = assets.findIndex((a) => a.id === currentAsset.id);

    let nextAsset: ImmichAsset | undefined;
    let prevAsset: ImmichAsset | undefined;
    let nextBucket: ImmichBucket | undefined;

    if (currentIndex > -1) {
      nextAsset = assets[currentIndex + 1];
      prevAsset = assets[currentIndex - 1];
    }
    
    if (currentBucketIndex > -1) {
      if(!nextAsset) {
        nextBucket = buckets[currentBucketIndex + 1];
      }
    }

    return { currentIndex, nextAsset, prevAsset, nextBucket };
  }, [assets, currentAsset.id, buckets, currentBucket]);

  const navigateToNext = () => {
    if (nextAsset) {
      router.push(`/slideshow/${currentBucket}/${nextAsset.id}`);
    } else if (nextBucket) {
      // If there's no next asset in this bucket, go to the first asset of the next bucket
      router.push(`/slideshow/${nextBucket.timeBucket}`);
    } else if (buckets.length > 0) {
      // If it's the last bucket, loop back to the first one
      router.push(`/slideshow/${buckets[0].timeBucket}`);
    } else {
      router.push('/');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        navigateToNext();
      } else if (e.key === "ArrowLeft" && prevAsset) {
        router.push(`/slideshow/${currentBucket}/${prevAsset.id}`);
      } else if (e.key === "Escape") {
        router.push(`/slideshow/${currentBucket}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextAsset, prevAsset, router, currentBucket, navigateToNext]);

  const isVideo = currentAsset.livePhotoVideoId || !currentAsset.isImage;

  // Auto-advance logic
  useEffect(() => {
    if (isVideo) {
      const videoElement = videoRef.current;
      if (videoElement) {
        const handleVideoEnd = () => navigateToNext();
        videoElement.addEventListener('ended', handleVideoEnd);
        return () => videoElement.removeEventListener('ended', handleVideoEnd);
      }
    } else {
      const timer = setTimeout(navigateToNext, IMAGE_DURATION_S * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentAsset.id, isVideo, navigateToNext]);


  // Prefetching logic
  useEffect(() => {
    // Preload next image in the sequence
    if (nextAsset?.isImage) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = `/api/immich/asset/${nextAsset.id}/thumbnail?size=preview`;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [nextAsset]);

  const assetDate = new Date(currentAsset.fileCreatedAt);
  const videoSrc = `/api/immich/asset/${currentAsset.id}/video/playback`;
  const imageSrc = `/api/immich/asset/${currentAsset.id}/thumbnail?size=preview`;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 text-white">
        <div>
          <h3 className="font-bold">{format(assetDate, "MMMM d, yyyy")}</h3>
          <p className="text-sm text-white/80">{format(assetDate, "h:mm a")}</p>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" asChild>
          <Link href={`/slideshow/${currentBucket}`}>
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Link>
        </Button>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentAsset.id}
            className="w-full h-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {isVideo ? (
              <video
                ref={videoRef}
                key={currentAsset.id}
                controls
                autoPlay
                muted
                playsInline
                className="max-h-full max-w-full object-contain"
              >
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
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
      </div>
      
      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between p-4 text-white">
         <div>
          <h3 className="font-bold">{format(now, "MMMM d, yyyy")}</h3>
          <p className="text-sm text-white/80">{format(now, "h:mm:ss a")}</p>
        </div>
      </footer>

      {/* Navigation */}
      {prevAsset && (
        <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white h-12 w-12 hover:bg-white/10 hover:text-white" asChild>
          <Link href={`/slideshow/${currentBucket}/${prevAsset.id}`} scroll={false}>
            <ChevronLeft className="h-8 w-8" />
            <span className="sr-only">Previous</span>
          </Link>
        </Button>
      )}

      
      <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white h-12 w-12 hover:bg-white/10 hover:text-white" onClick={navigateToNext}>
          <ChevronRight className="h-8 w-8" />
          <span className="sr-only">Next</span>
      </Button>
    </div>
  );
}

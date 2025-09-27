"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X, Video } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { ImmichAsset, ImmichBucket } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { prefetchSimilarMedia } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

type SlideshowClientProps = {
  buckets: ImmichBucket[];
  currentBucket: string;
  assets: ImmichAsset[];
  currentAsset: ImmichAsset;
};

export default function SlideshowClient({
  buckets,
  currentBucket,
  assets,
  currentAsset,
}: SlideshowClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const { currentIndex, nextAsset, prevAsset, nextBucket } = useMemo(() => {
    const currentIndex = assets.findIndex((a) => a.id === currentAsset.id);
    const nextAsset = currentIndex > -1 ? assets[currentIndex + 1] : undefined;
    const prevAsset = currentIndex > -1 ? assets[currentIndex - 1] : undefined;
    
    const currentBucketIndex = buckets.findIndex(b => b.timeBucket === currentBucket);
    const nextBucket = currentBucketIndex > -1 ? buckets[currentBucketIndex -1] : undefined; // Buckets are sorted descending

    return { currentIndex, nextAsset, prevAsset, nextBucket };
  }, [assets, currentAsset.id, buckets, currentBucket]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && nextAsset) {
        router.push(`/slideshow/${currentBucket}/${nextAsset.id}`);
      } else if (e.key === "ArrowLeft" && prevAsset) {
        router.push(`/slideshow/${currentBucket}/${prevAsset.id}`);
      } else if (e.key === "Escape") {
        router.push(`/slideshow/${currentBucket}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextAsset, prevAsset, router, currentBucket]);

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

  // AI-based prefetching for next bucket
  useEffect(() => {
    let isCancelled = false;
    const isVideo = currentAsset.livePhotoVideoId || !currentAsset.isImage;

    const playHandler = async () => {
      // Prefetch when near the end of the current bucket
      if (currentIndex >= assets.length - 5 && nextBucket && !isCancelled) {
        console.log(`Nearing end of bucket, prefetching for ${nextBucket.timeBucket}`);
        toast({
          title: "Prefetching next month...",
          description: `Getting ${nextBucket.timeBucket} ready.`,
        });
        await prefetchSimilarMedia(nextBucket.timeBucket, currentAsset.id);
      }
    };
    
    if (isVideo && videoRef.current) {
      videoRef.current.addEventListener('play', playHandler);
    } else if (currentIndex >= assets.length - 5) {
        // also prefetch for images near end
        playHandler();
    }

    return () => {
      isCancelled = true;
      if (videoRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        videoRef.current.removeEventListener('play', playHandler);
      }
    };
  }, [currentIndex, assets.length, nextBucket, currentAsset.id, toast, currentAsset.isImage, currentAsset.livePhotoVideoId]);

  const assetDate = new Date(currentAsset.fileCreatedAt);
  const isVideo = currentAsset.livePhotoVideoId || !currentAsset.isImage;
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

      {/* Navigation */}
      {prevAsset && (
        <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white h-12 w-12 hover:bg-white/10 hover:text-white" asChild>
          <Link href={`/slideshow/${currentBucket}/${prevAsset.id}`} scroll={false}>
            <ChevronLeft className="h-8 w-8" />
            <span className="sr-only">Previous</span>
          </Link>
        </Button>
      )}

      {nextAsset && (
        <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white h-12 w-12 hover:bg-white/10 hover:text-white" asChild>
          <Link href={`/slideshow/${currentBucket}/${nextAsset.id}`} scroll={false}>
            <ChevronRight className="h-8 w-8" />
            <span className="sr-only">Next</span>
          </Link>
        </Button>
      )}
    </div>
  );
}
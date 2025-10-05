
"use client";

import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";

import type { ImmichBucket } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const STORAGE_KEY = "slideshow_state";

export default function SlideshowLauncher({ buckets, onClose }: { buckets: ImmichBucket[], onClose?: () => void }) {
  const router = useRouter();

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    onClose?.();
    router.push("/");
  };

  const handleResume = () => {
    onClose?.();
    // Simply closing the dialog will resume the slideshow
  }
  
  const handleBucketClick = (bucketTime: string) => {
    onClose?.();
    router.push(`/?bucket=${bucketTime}`);
  }

  const getBucketDisplayName = (timeBucket: string) => {
    try {
      const date = parseISO(timeBucket);
      // If it's the first day of the month, but not the first day of the year
      if (date.getDate() === 1 && date.getMonth() !== 0) {
        return format(date, "MMMM yyyy");
      }
      // If it's the first day of the year
      if (date.getDate() === 1 && date.getMonth() === 0) {
        return format(date, "yyyy");
      }
      return format(date, "MMMM d, yyyy");
    } catch (e) {
      return timeBucket;
    }
  };

  // This is being rendered in a dialog
  const cardContent = (
    <>
        <CardHeader>
          <CardTitle>Immich Slideshow Launcher</CardTitle>
          <CardDescription>
            Resume your slideshow or start from a specific time bucket.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleResume} className="flex-1" size="lg">
              Resume Slideshow
            </Button>
            <Button onClick={handleReset} variant="outline" className="flex-1" size="lg">
              Clear Saved State & Restart
            </Button>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">Start from a specific bucket</h3>
            <ScrollArea className="h-64 w-full rounded-md border">
              <div className="p-4">
                {buckets.map((bucket) => (
                  <div key={bucket.timeBucket}>
                    <button
                      onClick={() => handleBucketClick(bucket.timeBucket)}
                      className="w-full p-2 rounded-md hover:bg-accent cursor-pointer flex justify-between items-center text-left"
                    >
                        <span>{getBucketDisplayName(bucket.timeBucket)}</span>
                        <span className="text-sm text-muted-foreground">{bucket.count} items</span>
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
    </>
  );

  return (
    <div className="w-full">
        {cardContent}
    </div>
  );
}

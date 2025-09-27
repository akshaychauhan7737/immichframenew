
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";

import type { ImmichBucket } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const STORAGE_KEY = "slideshow_state";

export default function SlideshowLauncher({ buckets }: { buckets: ImmichBucket[] }) {
  const router = useRouter();

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    // Redirect to the slideshow which will start from the beginning
    router.push("/");
  };

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

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Immich Slideshow Launcher</CardTitle>
          <CardDescription>
            Resume your slideshow or start from a specific time bucket.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1" size="lg">
              <Link href="/">Resume Slideshow</Link>
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
                    <Link href={`/slideshow/${bucket.timeBucket}`}>
                      <div className="p-2 rounded-md hover:bg-accent cursor-pointer flex justify-between items-center">
                        <span>{getBucketDisplayName(bucket.timeBucket)}</span>
                        <span className="text-sm text-muted-foreground">{bucket.count} items</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

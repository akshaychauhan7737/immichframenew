import { getBuckets } from "@/lib/immich";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Calendar, PictureInPicture } from "lucide-react";

export default async function SlideshowPage() {
  const buckets = await getBuckets();

  if (!buckets || buckets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <h2 className="text-2xl font-semibold">No Memories Found</h2>
        <p className="mt-2 text-muted-foreground">
          Could not connect to Immich or your library is empty.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Please check your environment variables and ensure your Immich server is running.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Your Memories</h1>
        <p className="text-muted-foreground">A journey through your photo library.</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {buckets.map((bucket) => {
          const date = new Date(bucket.timeBucket);
          const month = date.toLocaleString("default", { month: "long" });
          const year = date.getFullYear();

          return (
            <Link
              href={`/slideshow/${bucket.timeBucket}`}
              key={bucket.timeBucket}
              className="group"
            >
              <Card className="h-full flex flex-col transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span>
                      {month} {year}
                    </span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-2">
                    <PictureInPicture className="w-4 h-4 text-muted-foreground" />
                    {bucket.count} items
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

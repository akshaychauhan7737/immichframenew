import { getAssetsForBucket, getBuckets } from "@/lib/immich";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

export default async function BucketPage({
  params,
}: {
  params: { bucket: string };
}) {
  const assets = await getAssetsForBucket(params.bucket);

  // If the bucket itself has assets, redirect to the first one to start the slideshow.
  if (assets && assets.length > 0) {
    redirect(`/slideshow/${params.bucket}/${assets[0].id}`);
  }
  
  const date = new Date(params.bucket);
  const title = date.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/slideshow">
            <ArrowLeft />
            <span className="sr-only">Back to Months</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{assets.length} items</p>
        </div>
      </header>
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <h2 className="text-2xl font-semibold">No Assets Found</h2>
        <p className="mt-2 text-muted-foreground">
          This photo album is empty.
        </p>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const buckets = await getBuckets();
  return buckets.map((bucket) => ({
    bucket: bucket.timeBucket,
  }));
}

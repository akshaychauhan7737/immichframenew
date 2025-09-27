import { getAssetsForBucket, getBuckets } from "@/lib/immich";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function BucketPage({
  params,
}: {
  params: { bucket: string };
}) {
  const assets = await getAssetsForBucket(params.bucket);
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

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
        {assets.map((asset) => (
          <Link
            href={`/slideshow/${params.bucket}/${asset.id}`}
            key={asset.id}
            className="group relative aspect-square overflow-hidden rounded-md"
          >
            <Image
              src={`/api/immich/asset/${asset.id}/thumbnail`}
              alt="Immich asset"
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            {!asset.isImage && (
              <Video className="absolute bottom-1 right-1 h-5 w-5 text-white/80" />
            )}
            {asset.isFavorite && (
              <Badge variant="destructive" className="absolute top-1 left-1">
                Favorite
              </Badge>
            )}
          </Link>
        ))}
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

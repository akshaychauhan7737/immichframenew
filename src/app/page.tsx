import { getBuckets, getAssetsForBucket } from "@/lib/immich";
import { redirect } from "next/navigation";
import Loading from "./loading";

export default async function Home() {
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

  const firstBucket = buckets[0];
  const assets = await getAssetsForBucket(firstBucket.timeBucket);

  if (!assets || assets.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <h2 className="text-2xl font-semibold">No Assets Found</h2>
        <p className="mt-2 text-muted-foreground">
          Your first photo album is empty.
        </p>
      </div>
    );
  }

  const firstAsset = assets[0];
  redirect(`/slideshow/${firstBucket.timeBucket}/${firstAsset.id}`);

  return <Loading />;
}

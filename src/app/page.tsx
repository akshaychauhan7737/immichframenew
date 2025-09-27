import SlideshowClient from "@/components/slideshow-client";
import { getSlideshowData } from "./actions";

export default async function Home() {
  const { buckets, assets } = await getSlideshowData();

  if (!buckets || buckets.length === 0 || !assets || assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-black text-white">
        <h2 className="text-2xl font-semibold">No Memories Found</h2>
        <p className="mt-2 text-muted-foreground">
          Could not connect to Immich or your library is empty.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Please check your environment variables and ensure your Immich server is running and contains photos.
        </p>
      </div>
    );
  }

  return (
    <SlideshowClient
      initialBuckets={buckets}
      initialAssets={assets}
    />
  );
}
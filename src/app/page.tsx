
import { getBuckets } from "@/lib/immich";
import SlideshowLauncher from "@/components/slideshow-launcher";

export default async function Home() {
  const buckets = await getBuckets();
  return <SlideshowLauncher buckets={buckets} />;
}

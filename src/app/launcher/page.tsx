
import SlideshowLauncher from "@/components/slideshow-launcher";
import type { ImmichBucket } from "@/lib/types";

// Fetch buckets on the server using the API route
async function getBuckets(): Promise<ImmichBucket[]> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  try {
    const res = await fetch(`${appUrl}/api/immich/timeline/buckets?visibility=timeline&withPartners=true&withStacked=true`, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`Failed to fetch buckets: ${res.status} ${res.statusText}`);
      const errorBody = await res.text();
      console.error(`Error body: ${errorBody}`);
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching buckets in Home page:', error);
    return [];
  }
}

export default async function LauncherPage() {
  const buckets = await getBuckets();
  return <SlideshowLauncher buckets={buckets} />;
}

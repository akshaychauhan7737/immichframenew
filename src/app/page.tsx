
"use client";

import { usePathname } from 'next/navigation';
import SlideshowLoader from "@/components/slideshow-loader";
import SlideshowLauncher from '@/components/slideshow-launcher';
import { useEffect, useState } from 'react';
import type { ImmichBucket } from '@/lib/types';
import Loading from './loading';

// In a static export, we can't have a server-side fetch on every page load.
// We fetch this once on the client and pass it down.
async function getBuckets(): Promise<ImmichBucket[]> {
  try {
    const res = await fetch(`/api/immich/timeline/buckets?visibility=timeline&withPartners=true&withStacked=true`);
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


export default function Page() {
    const pathname = usePathname();
    const [buckets, setBuckets] = useState<ImmichBucket[] | null>(null);

    useEffect(() => {
      // Fetch buckets only when needed for the launcher
      if (pathname === '/launcher') {
        getBuckets().then(setBuckets);
      }
    }, [pathname]);

    if (pathname === '/launcher') {
      if (!buckets) {
        return <Loading />;
      }
      return <SlideshowLauncher buckets={buckets} />;
    }

    // Default to slideshow
    // Extract bucket from path like /slideshow/2024-01-01
    const pathParts = pathname.split('/').filter(Boolean);
    let startBucket: string | undefined = undefined;
    if (pathParts[0] === 'slideshow' && pathParts[1]) {
        startBucket = pathParts[1];
    }
    
    return <SlideshowLoader startBucket={startBucket} />;
}

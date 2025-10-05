
"use client";

import { useEffect, useState } from 'react';
import type { ImmichBucket } from '@/lib/types';
import SlideshowLauncher from '@/components/slideshow-launcher';
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
    console.error('Error fetching buckets in Launcher page:', error);
    return [];
  }
}


export default function LauncherPage() {
    const [buckets, setBuckets] = useState<ImmichBucket[] | null>(null);

    useEffect(() => {
      getBuckets().then(setBuckets);
    }, []);

    if (!buckets) {
      return <Loading />;
    }
    return <SlideshowLauncher buckets={buckets} />;
}

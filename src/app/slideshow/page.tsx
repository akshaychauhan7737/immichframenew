
"use client";

import SlideshowLoader from "@/components/slideshow-loader";
import { useSearchParams } from 'next/navigation';

export default function Page() {
    const searchParams = useSearchParams();
    const startBucket = searchParams.get('bucket') ?? undefined;
    
    return <SlideshowLoader startBucket={startBucket} />;
}

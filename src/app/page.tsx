
"use client";

import SlideshowLoader from "@/components/slideshow-loader";
import { usePathname } from 'next/navigation';

export default function Page() {
    const pathname = usePathname();
    // Default to slideshow
    // Extract bucket from path like /slideshow/2024-01-01
    const pathParts = pathname.split('/').filter(Boolean);
    let startBucket: string | undefined = undefined;
    if (pathParts[0] === 'slideshow' && pathParts[1]) {
        startBucket = pathParts[1];
    }
    
    return <SlideshowLoader startBucket={startBucket} />;
}

"use server";

import { prefetchSimilarMedia as prefetchSimilarMediaFlow } from "@/ai/flows/prefetch-similar-media";

/**
 * Wraps the prefetchSimilarMediaFlow to be called from the client,
 * using server-side environment variables for credentials.
 */
export async function prefetchSimilarMedia(bucket: string, assetId: string) {
  const immichApiKey = process.env.IMMICH_API_KEY;
  const immichBaseUrl = process.env.IMMICH_API_URL;

  if (!immichApiKey || !immichBaseUrl) {
    console.error(
      "prefetchSimilarMedia action failed: Immich credentials are not set on the server."
    );
    return { prefetchedAssets: [] };
  }

  try {
    console.log(`Prefetching triggered for next bucket from: ${bucket}`);
    const result = await prefetchSimilarMediaFlow({
      timeBucket: bucket,
      assetId,
      immichApiKey,
      immichBaseUrl,
    });
    return result;
  } catch (error) {
    console.error("Error executing prefetchSimilarMediaFlow:", error);
    return { prefetchedAssets: [] };
  }
}

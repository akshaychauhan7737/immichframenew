'use server';

/**
 * @fileOverview A flow to prefetch similar media from the next time bucket.
 *
 * - prefetchSimilarMedia - A function that prefetches similar media.
 * - PrefetchSimilarMediaInput - The input type for the prefetchSimilarMedia function.
 * - PrefetchSimilarMediaOutput - The return type for the prefetchSimilarMedia function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrefetchSimilarMediaInputSchema = z.object({
  timeBucket: z.string().describe('The time bucket to prefetch from (e.g., 2025-09-01).'),
  assetId: z.string().describe('The ID of the currently playing asset.'),
  immichApiKey: z.string().describe('The Immich API key.'),
  immichBaseUrl: z.string().describe('The Immich base URL.'),
});
export type PrefetchSimilarMediaInput = z.infer<typeof PrefetchSimilarMediaInputSchema>;

const PrefetchSimilarMediaOutputSchema = z.object({
  prefetchedAssets: z.array(z.string()).describe('An array of asset IDs that have been prefetched.'),
});
export type PrefetchSimilarMediaOutput = z.infer<typeof PrefetchSimilarMediaOutputSchema>;

export async function prefetchSimilarMedia(input: PrefetchSimilarMediaInput): Promise<PrefetchSimilarMediaOutput> {
  return prefetchSimilarMediaFlow(input);
}

const prefetchSimilarMediaFlow = ai.defineFlow(
  {
    name: 'prefetchSimilarMediaFlow',
    inputSchema: PrefetchSimilarMediaInputSchema,
    outputSchema: PrefetchSimilarMediaOutputSchema,
  },
  async input => {
    const {
      timeBucket,
      assetId,
      immichApiKey,
      immichBaseUrl,
    } = input;

    const nextBucketUrl = `${immichBaseUrl}/api/timeline/bucket?timeBucket=${encodeURIComponent(`${timeBucket}T00:00:00.000Z`)}&visibility=timeline&withPartners=true&withStacked=true`;

    const headers = {
      'x-api-key': immichApiKey,
    };

    try {
      const response = await fetch(nextBucketUrl, {
        headers,
      });

      if (!response.ok) {
        console.error(`Failed to fetch next bucket: ${response.status} ${response.statusText}`);
        return {prefetchedAssets: []};
      }

      const data = await response.json() as any;

      if (!data || !data.id || !Array.isArray(data.id)) {
        console.error('Invalid response format for next bucket');
        return {prefetchedAssets: []};
      }

      const prefetchedAssets = data.id as string[];

      console.log(`Prefetched assets from ${timeBucket}:`, prefetchedAssets);

      return {prefetchedAssets};
    } catch (error) {
      console.error('Error prefetching similar media:', error);
      return {prefetchedAssets: []};
    }
  }
);

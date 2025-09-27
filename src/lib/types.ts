export interface ImmichBucket {
  timeBucket: string;
  count: number;
}

export interface ImmichAsset {
  id: string;
  fileCreatedAt: string;
  isFavorite: boolean;
  type: 'IMAGE' | 'VIDEO';
  duration: string; // Videos always have a duration
  thumbhash: string | null;
  livePhotoVideoId: string | null;
  // Optional properties from getAssetById
  exifInfo?: {
    city?: string;
    state?: string;
    country?: string;
  }
}

// The response from the /timeline/bucket endpoint is not a clean array of objects
export interface ImmichAssetsResponse {
  items: ImmichAsset[];
  [key: string]: any; // Allow other properties
}

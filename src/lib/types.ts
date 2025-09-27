export interface ImmichBucket {
  timeBucket: string;
  count: number;
}

export interface ImmichAsset {
  id: string;
  fileCreatedAt: string;
  isFavorite: boolean;
  isImage: boolean;
  duration: string; // Videos always have a duration
  thumbhash: string | null;
  livePhotoVideoId: string | null;
}

// The response from the /timeline/bucket endpoint is not a clean array of objects
export interface ImmichAssetsResponse {
  id: string[];
  isFavorite: boolean[];
  isImage: boolean[];
  duration: string[];
  thumbhash: (string | null)[];
  fileCreatedAt: string[];
  livePhotoVideoId: (string | null)[];
  [key: string]: any; // Allow other properties
}

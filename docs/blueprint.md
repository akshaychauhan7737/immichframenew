# **App Name**: Immich Slideshow

## Core Features:

- Monthly Bucket Fetching: Fetch time buckets (months) from the Immich API to organize photos and videos.
- Content Fetching by Bucket: Fetch asset IDs for each time bucket from the Immich API.
- Image/Video Display: Display thumbnails for images and videos, fetching them from Immich API. For videos, enable streaming playback. Ensure content respects existing visibility settings from the Immich installation
- Next Content Prefetching: When video starts streaming, the application uses the "content-length" and "content-range" response headers to seamlessly play through to the end of a video, and then use the information from the month time buckets to fetch, on a best-effort basis, and prebuffer subsequent image assets. The goal of the tool is to display visually-similar media.
- API Key Management: Securely store the Immich API key using environment variables.
- Slide Navigation: Basic controls to navigate between months or individual assets in a slideshow format. Uses browser history and keyboard shortcuts for a faster, more natural experience.
- Progressive Image Loading: Improve image loading UX.

## Style Guidelines:

- Primary color: Light, desaturated blue (#A0D2EB) to create a calm, spacious environment suitable for photo and video display.
- Background color: White (#FFFFFF) to ensure photos and videos are the focal point.
- Accent color: Slightly darker blue (#74B9E3), an analogous hue with added brightness, for interactive elements.
- Font: 'PT Sans', a humanist sans-serif for a modern, readable look, suitable for both headlines and body text.
- Clean, full-screen layout to maximize content visibility. Image and video thumbnails should take up the majority of the screen, with navigation controls subtly placed.
- Simple, clear icons for navigation and controls.
- Subtle transitions when changing months or assets to provide a smooth viewing experience.
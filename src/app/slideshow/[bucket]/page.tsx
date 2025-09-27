
import SlideshowLoader from "@/components/slideshow-loader";

export default function SlideshowPage({ params }: { params: { bucket: string } }) {
  return <SlideshowLoader bucket={params.bucket} />;
}

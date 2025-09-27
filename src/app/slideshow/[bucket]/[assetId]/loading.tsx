import { Skeleton } from "@/components/ui/skeleton";
import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full h-full flex items-center justify-center">
        <LoaderCircle className="w-12 h-12 text-white/50 animate-spin" />
        <Skeleton className="w-full h-full max-w-6xl max-h-6xl aspect-video bg-white/10" />
      </div>
    </div>
  );
}

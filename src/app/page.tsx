import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <div className="relative flex-1 flex flex-col items-center justify-center text-center p-4">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 dark:opacity-20"
        >
          <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400 dark:from-blue-700"></div>
          <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 dark:to-indigo-600"></div>
        </div>
        <div className="relative z-10">
          <Film className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Immich Slideshow
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Rediscover your memories. A beautiful, seamless slideshow experience
            for your self-hosted Immich library.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/slideshow">View Memories</Link>
            </Button>
          </div>
        </div>
      </div>
      <footer className="w-full py-4 text-center text-muted-foreground text-sm">
        <p>Powered by Next.js and Immich. Built with ❤️.</p>
      </footer>
    </main>
  );
}

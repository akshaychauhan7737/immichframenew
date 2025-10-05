"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
       <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-6xl font-bold text-primary">404</CardTitle>
          <CardDescription className="text-xl mt-2">Page Not Found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">
            Sorry, the page you are looking for does not exist.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => router.back()}>Go Back</Button>
            <Button variant="outline" asChild>
              <Link href="/launcher">Go to Launcher</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

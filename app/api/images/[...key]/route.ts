import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { key } = await params;
    const resourceKey = key.join("/");

    if (!resourceKey) {
      return new NextResponse("Missing image key", { status: 400 });
    }

    const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
    const apiKey = process.env.CLOUDFLARE_WORKER_API_KEY;

    if (!workerUrl || !apiKey) {
      console.error("Cloudflare Worker configuration missing");
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    const res = await fetch(`${workerUrl}?key=${resourceKey}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Worker error (${res.status}):`, errorText);
      return new NextResponse("Image not found", { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

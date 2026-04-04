import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeShortVideo, getCurrentProjectBundleOrThrow } from "@/lib/video-review-service";

const createProjectSchema = z.object({
  sourceInput: z.string().min(1),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bundle = await getCurrentProjectBundleOrThrow().catch(() => null);

  if (url.searchParams.get("format") === "export") {
    return NextResponse.json(bundle, {
      headers: {
        "Content-Disposition": 'attachment; filename="project-export.json"',
      },
    });
  }

  return NextResponse.json({ data: bundle });
}

export async function POST(request: Request) {
  const payload = createProjectSchema.parse(await request.json());
  const bundle = await analyzeShortVideo(payload.sourceInput);

  return NextResponse.json({ data: bundle }, { status: 201 });
}

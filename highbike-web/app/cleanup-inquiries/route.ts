
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_LIMIT = 20;
const RETENTION_DAYS = 90;
const STORAGE_BUCKET = "motorcycle-photos";

// 실제 삭제는 아직 활성화하지 않습니다.
const DELETE_ENABLED = false;

function respond(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function validPath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.split("/").some(
      (part) => part === "" || part === "." || part === ".."
    ) &&
    !path.startsWith(`${STORAGE_BUCKET}/`)
  );
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return respond({ ok: false, error: "Unauthorized" }, 401);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return respond(
      { ok: false, error: "Database not configured" },
      503
    );
  }

  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const cutoff = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("purchase_inquiries")
    .select(
      "id, photo_paths, cleanup_started_at, cleanup_token"
    )
    .eq("status", "cancelled")
    .eq("deletion_hold", false)
    .not("closed_at", "is", null)
    .lte("closed_at", cutoff)
    .order("closed_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    console.error(
      "Cleanup query failed",
      error.code,
      error.message
    );

    return respond(
      { ok: false, error: "Cleanup query failed" },
      503
    );
  }

  const candidates = data ?? [];
  let photoCount = 0;
  let lockedCount = 0;
  let invalidPathCount = 0;

  for (const row of candidates) {
    if (
      row.cleanup_started_at !== null ||
      row.cleanup_token !== null
    ) {
      lockedCount++;
      continue;
    }

    const paths = Array.isArray(row.photo_paths)
      ? row.photo_paths
      : [];

    if (!paths.every(validPath)) {
      invalidPathCount++;
      continue;
    }

    photoCount += paths.length;
  }

  // 현재는 실제 삭제를 실행하지 않고 대상만 확인합니다.
  if (!DELETE_ENABLED) {
    console.info("Cleanup preview completed", {
      candidatesInBatch: candidates.length,
      lockedCount,
      invalidPathCount,
      photoCount,
      deleted: 0,
    });

    return respond({
      ok: true,
      mode: "dry-run",
      candidatesInBatch: candidates.length,
      lockedCount,
      invalidPathCount,
      photoCount,
      deleted: 0,
      message: "No data or photos were deleted.",
    });
  }

  // 실제 삭제는 복구 및 재시도 절차 검증 후 연결합니다.
  return respond(
    {
      ok: false,
      mode: "not-configured",
      error:
        "Deletion pipeline is not enabled. Recovery verification required.",
      deleted: 0,
    },
    503
  );
}

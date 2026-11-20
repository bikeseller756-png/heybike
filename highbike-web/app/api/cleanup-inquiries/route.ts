
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 운영 설정
// 최종 검증 전까지 false 유지
const DELETE_ENABLED = true;

const BUCKET = "motorcycle-photos";
const BATCH_SIZE = 3;
const MAX_PHOTOS = 99;
const RETENTION_DAYS = 90;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Inquiry = {
  id: string;
  photo_paths: string[] | null;
  closed_at: string | null;
};

function respond(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function getCutoff() {
  return new Date(
    Date.now() -
      RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
}

function validPath(
  value: unknown,
  inquiryId: string
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const parts = value.split("/");

  if (parts.length !== 2) {
    return false;
  }

  const [folder, filename] = parts;

  if (
    !UUID.test(folder) ||
    folder.toLowerCase() !== inquiryId.toLowerCase()
  ) {
    return false;
  }

  const match = filename.match(
    /^([0-9a-f-]{36})\.(jpg|jpeg|png|webp)$/i
  );

  return !!match && UUID.test(match[1]);
}

function validatePaths(
  paths: string[],
  inquiryId: string
) {
  return (
    UUID.test(inquiryId) &&
    paths.length <= MAX_PHOTOS &&
    paths.every((path) =>
      validPath(path, inquiryId)
    ) &&
    new Set(paths).size === paths.length
  );
}

function checkFiles(
  paths: string[],
  names: string[]
) {
  const expectedNames = paths.map(
    (path) => path.split("/")[1]
  );

  const expected = new Set(expectedNames);
  const actual = new Set(names);

  if (
    paths.length > MAX_PHOTOS ||
    names.length > MAX_PHOTOS ||
    expected.size !== expectedNames.length ||
    actual.size !== names.length
  ) {
    return {
      valid: false,
      remainingPaths: [] as string[],
      partial: false,
    };
  }

  // DB에 등록되지 않은 파일이 있으면 삭제 중단
  if (names.some((name) => !expected.has(name))) {
    return {
      valid: false,
      remainingPaths: [] as string[],
      partial: false,
    };
  }

  const remainingPaths = paths.filter((path) =>
    actual.has(path.split("/")[1])
  );

  return {
    valid: true,
    remainingPaths,
    partial: remainingPaths.length < paths.length,
  };
}

export async function GET(
  request: NextRequest
) {
  const cronSecret = process.env.CRON_SECRET;

  if (
    !cronSecret ||
    request.headers.get("authorization") !==
      `Bearer ${cronSecret}`
  ) {
    return respond(
      {
        ok: false,
        error: "Unauthorized",
      },
      401
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return respond(
      {
        ok: false,
        error: "Missing configuration",
      },
      503
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const result = {
    ok: true,
    mode: DELETE_ENABLED
      ? "active"
      : "dry-run",
    deletionEnabled: DELETE_ENABLED,
    cutoff: getCutoff(),
    candidates: 0,
    validated: 0,
    partialRecoveryCandidates: 0,
    invalidPaths: 0,
    storageErrors: 0,
    mismatchedFiles: 0,
    deleted: 0,
    failed: 0,
    hasMore: false,
  };

  // 활성 모드에서만 오래된 잠금 복구
  if (DELETE_ENABLED) {
    const {
      data: releasedCount,
      error: recoveryError,
    } = await supabase.rpc(
      "release_stale_inquiry_cleanup_locks"
    );

    if (recoveryError) {
      console.error(
        "Cleanup lock recovery failed",
        recoveryError.message
      );

      return respond(
        {
          ok: false,
          error: "Lock recovery failed",
          deleted: 0,
        },
        503
      );
    }

    console.info(
      "Cleanup lock recovery completed",
      { releasedCount }
    );
  } else {
    console.info(
      "Cleanup lock recovery skipped",
      {
        mode: "dry-run",
        reason: "Deletion is disabled",
      }
    );
  }

  const {
    data,
    error: queryError,
  } = await supabase
    .from("purchase_inquiries")
    .select("id,photo_paths,closed_at")
    .eq("status", "cancelled")
    .eq("deletion_hold", false)
    .not("closed_at", "is", null)
    .lte("closed_at", result.cutoff)
    .is("cleanup_started_at", null)
    .is("cleanup_token", null)
    .order("closed_at", {
      ascending: true,
    })
    .limit(BATCH_SIZE + 1);

  if (queryError) {
    console.error(
      "Cleanup query failed",
      queryError.message
    );

    return respond(
      {
        ok: false,
        error: "Query failed",
      },
      503
    );
  }

  const allRows = (data ?? []) as Inquiry[];
  const rows = allRows.slice(0, BATCH_SIZE);

  result.candidates = rows.length;
  result.hasMore =
    allRows.length > BATCH_SIZE;

  for (const row of rows) {
    const paths = Array.isArray(
      row.photo_paths
    )
      ? row.photo_paths
      : [];

    if (!validatePaths(paths, row.id)) {
      result.invalidPaths++;
      result.ok = false;

      console.error(
        "Cleanup invalid photo paths",
        { inquiryId: row.id }
      );

      continue;
    }

    // 첫 번째 Storage 검증
    const {
      data: files,
      error: listError,
    } = await supabase.storage
      .from(BUCKET)
      .list(row.id, {
        limit: MAX_PHOTOS + 1,
        offset: 0,
      });

    if (
      listError ||
      !files ||
      files.length > MAX_PHOTOS
    ) {
      result.storageErrors++;
      result.ok = false;

      console.error(
        "Cleanup storage listing failed",
        {
          inquiryId: row.id,
          message:
            listError?.message ??
            "Invalid storage listing",
        }
      );

      continue;
    }

    const initialCheck = checkFiles(
      paths,
      files.map((file) => file.name)
    );

    if (!initialCheck.valid) {
      result.mismatchedFiles++;
      result.ok = false;

      console.error(
        "Cleanup file mismatch",
        { inquiryId: row.id }
      );

      continue;
    }

    result.validated++;

    if (initialCheck.partial) {
      result.partialRecoveryCandidates++;
    }

    // 검증 모드에서는 실제 삭제하지 않음
    if (!DELETE_ENABLED) {
      continue;
    }

    // DB 잠금 획득
    const {
      data: token,
      error: claimError,
    } = await supabase.rpc(
      "claim_inquiry_cleanup_with_token",
      {
        target_id: row.id,
      }
    );

    if (claimError || !token) {
      result.failed++;
      result.ok = false;

      console.error(
        "Cleanup claim failed",
        {
          inquiryId: row.id,
          message:
            claimError?.message ??
            "No cleanup token",
        }
      );

      continue;
    }

    let completed = false;

    try {
      // 잠금 획득 후 상담 상태 재검증
      const {
        data: locked,
        error: lockedError,
      } = await supabase
        .from("purchase_inquiries")
        .select(
          "photo_paths,status,deletion_hold,closed_at"
        )
        .eq("id", row.id)
        .eq("cleanup_token", token)
        .single();

      if (
        lockedError ||
        !locked ||
        locked.status !== "cancelled" ||
        locked.deletion_hold !== false ||
        !locked.closed_at ||
        new Date(
          locked.closed_at
        ).getTime() >
          Date.now() -
            RETENTION_DAYS *
              24 *
              60 *
              60 *
              1000 ||
        !Array.isArray(locked.photo_paths) ||
        JSON.stringify(
          locked.photo_paths
        ) !== JSON.stringify(paths)
      ) {
        throw new Error(
          "Locked inquiry verification failed"
        );
      }

      // 사진 삭제 직전 재확인
      const {
        data: latestFiles,
        error: latestError,
      } = await supabase.storage
        .from(BUCKET)
        .list(row.id, {
          limit: MAX_PHOTOS + 1,
          offset: 0,
        });

      if (
        latestError ||
        !latestFiles ||
        latestFiles.length > MAX_PHOTOS
      ) {
        throw new Error(
          "Storage recheck failed"
        );
      }

      const latestCheck = checkFiles(
        paths,
        latestFiles.map(
          (file) => file.name
        )
      );

      if (!latestCheck.valid) {
        throw new Error(
          "Unexpected Storage files"
        );
      }

      // 사진 먼저 삭제
      if (
        latestCheck.remainingPaths.length > 0
      ) {
        const {
          error: removeError,
        } = await supabase.storage
          .from(BUCKET)
          .remove(
            latestCheck.remainingPaths
          );

        if (removeError) {
          throw new Error(
            "Photo removal failed"
          );
        }
      }

      // 사진이 실제로 없어졌는지 확인
      const {
        data: afterFiles,
        error: afterError,
      } = await supabase.storage
        .from(BUCKET)
        .list(row.id, {
          limit: MAX_PHOTOS + 1,
          offset: 0,
        });

      if (
        afterError ||
        !afterFiles ||
        afterFiles.length !== 0
      ) {
        throw new Error(
          "Photos remain after deletion"
        );
      }

      // 사진 경로 초기화
      const {
        data: cleared,
        error: clearError,
      } = await supabase.rpc(
        "clear_inquiry_photo_paths_with_token",
        {
          target_id: row.id,
          expected_token: token,
          expected_paths: paths,
        }
      );

      if (
        clearError ||
        cleared !== true
      ) {
        throw new Error(
          "Photo path clearing failed"
        );
      }

      // 마지막으로 상담 기록 삭제
      const {
        data: removed,
        error: deleteError,
      } = await supabase.rpc(
        "delete_expired_cancelled_inquiry_with_token",
        {
          target_id: row.id,
          expected_token: token,
        }
      );

      if (
        deleteError ||
        removed !== true
      ) {
        throw new Error(
          "Inquiry deletion failed"
        );
      }

      completed = true;
      result.deleted++;

      console.info(
        "Cleanup inquiry deleted",
        { inquiryId: row.id }
      );
    } catch (error) {
      result.failed++;
      result.ok = false;

      console.error(
        "Cleanup item failed",
        {
          inquiryId: row.id,
          message:
            error instanceof Error
              ? error.message
              : "Unknown error",
        }
      );
    } finally {
      // 실패 시 해당 잠금 해제
      if (!completed) {
        const {
          data: released,
          error: releaseError,
        } = await supabase.rpc(
          "release_inquiry_cleanup_with_token",
          {
            target_id: row.id,
            expected_token: token,
          }
        );

        if (
          releaseError ||
          released !== true
        ) {
          result.ok = false;

          console.error(
            "Cleanup lock release failed",
            {
              inquiryId: row.id,
              message:
                releaseError?.message ??
                "Lock not released",
            }
          );
        }
      }
    }
  }

  console.info(
    "Cleanup production completed",
    result
  );

  return respond(result);
}

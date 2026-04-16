/**
 * K-apt 단지 기본정보 CSV → Supabase 일괄 임포트
 *
 * 사용법:
 *   npx tsx scripts/import-kapt.ts <CSV_PATH>
 *
 * K-apt CSV 컬럼 순서 (헤더 행 기준):
 *   단지코드, 단지명, 시도명, 군구명, 번지, 도로명주소, 관리방식, 준공연도, 세대수, ...
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// ── 환경 변수 ────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  .env.local의 SUPABASE 변수를 먼저 설정해주세요.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── CSV 파싱 ──────────────────────────────────────────────────────────────────
function parseCSV(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, ""); // BOM 제거
  const lines = raw.split(/\r?\n/).filter(Boolean);

  // 첫 줄 면책고지, 두 번째 줄 헤더
  const headerLine = lines.findIndex((l) => l.startsWith('"단지코드"') || l.startsWith('단지코드'));
  if (headerLine === -1) {
    console.error("❌  헤더 행(단지코드, 단지명, ...)을 찾을 수 없어요. CSV 구조를 확인해주세요.");
    process.exit(1);
  }

  const parseRow = (line: string) =>
    line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));

  const headers = parseRow(lines[headerLine]);
  const idx = (name: string) => headers.findIndex((h) => h.includes(name));

  const COL = {
    code:    idx("단지코드"),
    name:    idx("단지명"),
    sido:    idx("시도명"),
    gungu:   idx("군구명"),
    jibun:   idx("번지"),
    road:    idx("도로명주소"),
  };

  const rows = lines.slice(headerLine + 1);
  console.log(`📄  총 ${rows.length.toLocaleString()}개 단지 파싱 중...`);

  return rows
    .map((line) => parseRow(line))
    .filter((cols) => cols[COL.name]?.trim())
    .map((cols) => {
      const name  = cols[COL.name] ?? "";
      const sido  = cols[COL.sido] ?? "";
      const gungu = cols[COL.gungu] ?? "";
      const road  = cols[COL.road]?.trim() || [sido, gungu, cols[COL.jibun]].filter(Boolean).join(" ");
      const slug  = `kapt-${cols[COL.code] ?? Math.random().toString(36).slice(2)}`;

      return { name, address: road, district: gungu, city: sido, slug, participant_goal: 50 };
    });
}

// ── Supabase 업서트 ───────────────────────────────────────────────────────────
async function importBatch(rows: ReturnType<typeof parseCSV>) {
  const BATCH = 500;
  let inserted = 0;
  let skipped  = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);

    const { error, count } = await supabase
      .from("apartments")
      .upsert(batch, { onConflict: "slug", ignoreDuplicates: true })
      .select("id");

    if (error) {
      console.error(`❌  배치 ${i}~${i + BATCH} 오류:`, error.message);
    } else {
      inserted += count ?? 0;
    }

    skipped = (i + BATCH) - inserted;
    process.stdout.write(`\r⏳  ${Math.min(i + BATCH, rows.length).toLocaleString()} / ${rows.length.toLocaleString()} 처리 중...`);
  }

  console.log(`\n✅  완료 — 신규 ${inserted.toLocaleString()}개 추가, ${Math.max(0, rows.length - inserted).toLocaleString()}개 이미 존재`);
}

// ── 실행 ──────────────────────────────────────────────────────────────────────
const csvPath = process.argv[2];
if (!csvPath) {
  console.error("사용법: npx tsx scripts/import-kapt.ts <CSV_PATH>");
  process.exit(1);
}

const rows = parseCSV(path.resolve(csvPath));
console.log(`🏢  ${rows.length.toLocaleString()}개 단지 Supabase에 임포트합니다.`);
importBatch(rows);

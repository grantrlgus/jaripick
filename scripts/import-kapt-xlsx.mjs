/**
 * K-apt 단지 기본정보 xlsx → Supabase 일괄 임포트
 * node scripts/import-kapt-xlsx.mjs
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  .env.local의 SUPABASE 변수를 설정해주세요.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── 엑셀 파싱 ────────────────────────────────────────────────────────────────
const XLSX_PATH = "/Users/gihyunhwang/Downloads/20260410_단지_기본정보.xlsx";

console.log("📂  엑셀 파일 로딩 중...");
const wb   = XLSX.readFile(XLSX_PATH, { dense: true });
const ws   = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

// Row 0: 면책고지, Row 1: 헤더, Row 2~: 데이터
const DATA_START = 2;
const total = rows.length - DATA_START;
console.log(`🏢  총 ${total.toLocaleString()}개 단지 처리 시작`);

// 컬럼 인덱스 (헤더 행 기준)
const H = rows[1];
const col = (name) => H.indexOf(name);
const C = {
  sido:   col("시도"),
  gungu:  col("시군구"),
  code:   col("단지코드"),
  name:   col("단지명"),
  type:   col("단지분류"),
  addr:   col("도로명주소"),
  jibun:  col("법정동주소"),
};

function slugify(code) {
  return `kapt-${String(code).toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

function buildRow(r) {
  const name  = String(r[C.name]  ?? "").trim();
  const sido  = String(r[C.sido]  ?? "").trim();
  const gungu = String(r[C.gungu] ?? "").trim();
  const code  = String(r[C.code]  ?? "").trim();

  if (!name || !code) return null;

  // 도로명 → 법정동 순으로 fallback
  const addr = String(r[C.addr] ?? r[C.jibun] ?? "").trim() || `${sido} ${gungu}`;

  return {
    name,
    address: addr,
    district: gungu || sido,
    city: sido,
    slug: slugify(code),
    participant_goal: 50,
  };
}

// ── Supabase 업서트 ───────────────────────────────────────────────────────────
const BATCH = 300;
let inserted = 0;
let errors   = 0;

for (let i = DATA_START; i < rows.length; i += BATCH) {
  const chunk = rows
    .slice(i, i + BATCH)
    .map(buildRow)
    .filter(Boolean);

  if (chunk.length === 0) continue;

  const { error } = await supabase
    .from("apartments")
    .upsert(chunk, { onConflict: "slug", ignoreDuplicates: true });

  if (error) {
    errors++;
    console.error(`\n❌  배치 오류 (row ${i}):`, error.message);
  } else {
    inserted += chunk.length;
  }

  const done = Math.min(i + BATCH - DATA_START, total);
  process.stdout.write(`\r⏳  ${done.toLocaleString()} / ${total.toLocaleString()} (${Math.round(done/total*100)}%)`);
}

console.log(`\n✅  완료 — ${inserted.toLocaleString()}개 처리, 오류 ${errors}건`);

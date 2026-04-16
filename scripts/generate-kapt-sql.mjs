/**
 * K-apt 엑셀 → supabase/seed-kapt.sql 생성
 * node scripts/generate-kapt-sql.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import XLSX from "xlsx";

const XLSX_PATH = "/Users/gihyunhwang/Downloads/20260410_단지_기본정보.xlsx";
const OUT_PATH  = "supabase/seed-kapt.sql";

console.log("📂  엑셀 로딩 중...");
const wb   = XLSX.readFile(XLSX_PATH, { dense: true });
const ws   = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

// Row 0: 면책고지, Row 1: 헤더, Row 2~: 데이터
const HEADER = rows[1];
const col    = (name) => HEADER.indexOf(name);
const C = {
  sido:  col("시도"),
  gungu: col("시군구"),
  code:  col("단지코드"),
  name:  col("단지명"),
  addr:  col("도로명주소"),
  jibun: col("법정동주소"),
};

// Carry-forward for merged cells
let lastSido  = "";
let lastGungu = "";

function parseCityDistrict(addr) {
  const parts = addr.trim().split(" ");
  // "서울특별시 종로구 ..." → city=서울특별시, district=종로구
  // "경기도 성남시 분당구 ..." → city=경기도, district=분당구
  // "영주시 영주로299 ..." → city=영주시, district=영주시 (no 구/군)
  const city = parts[0] ?? "";
  let district = "";
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    if (p.endsWith("구") || p.endsWith("군") || p.endsWith("시")) {
      district = p;
      break;
    }
  }
  // If no administrative division found, district = city
  return { city, district: district || city };
}

function esc(s) {
  return String(s ?? "").replace(/'/g, "''");
}

const DATA_START = 2;
const lines      = [];
let   count      = 0;

for (let i = DATA_START; i < rows.length; i++) {
  const r = rows[i];

  // Carry-forward
  const sido  = String(r[C.sido]  ?? "").trim();
  const gungu = String(r[C.gungu] ?? "").trim();
  if (sido)  lastSido  = sido;
  if (gungu) lastGungu = gungu;

  const code = String(r[C.code] ?? "").trim();
  const name = String(r[C.name] ?? "").trim();
  if (!code || !name) continue;

  // Address: road → jibun → fallback (use || because defval:"" makes ?? useless)
  const rawAddr = String(r[C.addr] || r[C.jibun] || "").trim();
  const addr    = rawAddr || `${lastSido} ${lastGungu}`.trim();

  // City/district: use Excel columns (carry-forward), fallback to parse address
  let city     = lastSido;
  let district = lastGungu;
  if (!city || !district) {
    const parsed = parseCityDistrict(addr);
    if (!city)     city     = parsed.city;
    if (!district) district = parsed.district;
  }

  const slug = `kapt-${code.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  lines.push(`('${esc(name)}','${esc(addr)}','${esc(district)}','${esc(city)}','${esc(slug)}',50)`);
  count++;
}

const CHUNK = 500;
const chunks = [];
for (let i = 0; i < lines.length; i += CHUNK) {
  const batch = lines.slice(i, i + CHUNK).join(",\n");
  chunks.push(
    `INSERT INTO apartments (name, address, district, city, slug, participant_goal)\nVALUES\n${batch}\nON CONFLICT (slug) DO NOTHING;`
  );
}

const sql = `-- K-apt 전국 아파트 단지 시드 데이터 (${count.toLocaleString()}개)\n\n` + chunks.join("\n\n");
writeFileSync(OUT_PATH, sql, "utf-8");

const kb = Math.round(Buffer.byteLength(sql, "utf-8") / 1024);
console.log(`✅  ${count.toLocaleString()}개 단지 → ${OUT_PATH} (${kb} KB)`);

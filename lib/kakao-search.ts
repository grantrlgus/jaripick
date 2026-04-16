export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
}

/** Parse city / district from Korean address string */
export function parseKakaoAddress(addressName: string) {
  const parts = addressName.trim().split(" ");
  const city = parts[0] ?? "";
  // "경기도 성남시 분당구 ..." → district = 분당구
  // "서울특별시 서초구 ..."   → district = 서초구
  let district = "";
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].endsWith("구") || parts[i].endsWith("군")) {
      district = parts[i];
      break;
    }
    if (parts[i].endsWith("시") && i === 1) {
      // 직할시 or 광역시: 다음 토큰이 구/군인지 확인
      continue;
    }
  }
  // fallback: 두 번째 토큰
  if (!district) district = parts[1] ?? "";
  return { city, district };
}

/** Convert a Kakao place result → ApartmentWithCount shape (count = 0, not yet in DB) */
export function kakaoPlaceToApt(place: KakaoPlace) {
  const addr = place.road_address_name || place.address_name;
  const { city, district } = parseKakaoAddress(place.address_name);
  return {
    id: place.id,          // Kakao place ID (used as key in search results)
    slug: `k-${place.id}`, // DB slug when auto-created
    name: place.place_name,
    address: addr,
    district,
    city,
    participant_goal: 50,
    participant_count: 0,
    created_at: "",
  };
}

/** Search Kakao Local API for apartment complexes */
export async function searchKakaoApartments(query: string): Promise<KakaoPlace[]> {
  const apiKey = process.env.AUTH_KAKAO_ID; // REST API key doubles as Local API key
  if (!apiKey || !query.trim()) return [];

  try {
    const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    url.searchParams.set("query", query + " 아파트");
    url.searchParams.set("size", "15");
    url.searchParams.set("category_group_code", ""); // no filter — apartment category is mixed

    const res = await fetch(url.toString(), {
      headers: { Authorization: `KakaoAK ${apiKey}` },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error("Kakao Local API error:", res.status);
      return [];
    }

    const data = await res.json();
    const places: KakaoPlace[] = data.documents ?? [];

    // Keep only results that look like apartment complexes
    return places.filter(
      (p) =>
        p.category_name?.includes("아파트") ||
        p.place_name.endsWith("아파트") ||
        p.place_name.match(/(아파트|단지|자이|래미안|푸르지오|힐스테이트|e편한세상|롯데캐슬|SK뷰|아이파크|더샵|엘스|리센츠|트리지움|헬리오|리버|파크|뷰|시티|캐슬|파크|빌|타워)/)
    );
  } catch (e) {
    console.error("searchKakaoApartments error:", e);
    return [];
  }
}

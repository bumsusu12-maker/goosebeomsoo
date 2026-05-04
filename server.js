const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;
const API_URL = "https://cems.moneybox.or.kr/api/moneybox.php";

const TARGET = [
  "USD","JPY","CNY","TWD","HKD","EUR","AUD",
  "SGD","CAD","GBP","THB","PHP","MYR","VND","IDR","CHF","NZD","AED"
];

const branches = [
  { name: "머니박스 강남", area: "강남", origin: "http://moneyboxgn.com", referer: "http://moneyboxgn.com/" },
  { name: "머니박스 성수", area: "성수", origin: "https://moneyboxseongsu.com", referer: "https://moneyboxseongsu.com/" },
  { name: "머니박스 홍대", area: "홍대", origin: "http://www.moneyboxhd.com", referer: "http://www.moneyboxhd.com/" },
  { name: "머니박스 명동", area: "명동", origin: "http://www.moneyboxmd.com", referer: "http://www.moneyboxmd.com/" },
  { name: "머니박스 인사동", area: "인사동", origin: "http://www.moneyboxis.com", referer: "http://www.moneyboxis.com/" },
  { name: "머니박스 남대문", area: "남대문", origin: "http://www.moneyboxndm.com", referer: "http://www.moneyboxndm.com/" },
  { name: "머니박스 명동2", area: "명동2", origin: "http://www.moneyboxmd2.com", referer: "http://www.moneyboxmd2.com/" },
  { name: "머니박스 충무로", area: "충무로", origin: "https://moneyboxcmr.com", referer: "https://moneyboxcmr.com/" },
  { name: "머니박스 동대문", area: "동대문", origin: "http://www.moneyboxddm.com", referer: "http://www.moneyboxddm.com/" },
  { name: "머니박스 서울역", area: "서울역", origin: "http://www.moneyboxsst.com", referer: "http://www.moneyboxsst.com/" },
  { name: "머니박스 부산역", area: "부산역", origin: "http://www.moneyboxbst.com", referer: "http://www.moneyboxbst.com/" },
  { name: "머니박스 강남신사", area: "강남신사", origin: "https://moneyboxsinsa.com", referer: "https://moneyboxsinsa.com/" },
  { name: "머니박스 여의도", area: "여의도", origin: "https://moneyboxyud.com", referer: "https://moneyboxyud.com/" },
  { name: "머니박스 광장시장", area: "광장시장", origin: "https://moneyboxkjm.com", referer: "https://moneyboxkjm.com/" },
  { name: "머니박스 연남", area: "연남", origin: "https://moneyboxynd.com", referer: "https://moneyboxynd.com/" },
  { name: "머니박스 이태원", area: "이태원", origin: "http://moneyboxitw.com", referer: "http://moneyboxitw.com/" },
  { name: "머니박스 부평", area: "부평", origin: "http://moneyboxbp.com", referer: "http://moneyboxbp.com/" },
  { name: "머니박스 대구", area: "대구", origin: "http://moneyboxdg.com", referer: "http://moneyboxdg.com/" },
  { name: "머니박스 제주", area: "제주", origin: "http://www.moneyboxjeju.com", referer: "http://www.moneyboxjeju.com/" },
  { name: "머니박스 제주동문", area: "제주동문", origin: "https://www.moneyboxjjdm.com", referer: "https://www.moneyboxjjdm.com/" },
  { name: "머니박스 수원", area: "수원", origin: "https://www.moneyboxsw.com", referer: "https://www.moneyboxsw.com/" },
  { name: "머니박스 마포", area: "마포", origin: "http://www.moneyboxmp.com", referer: "http://www.moneyboxmp.com/" },
  { name: "머니박스 송도", area: "송도", origin: "https://www.moneyboxsd.com", referer: "https://www.moneyboxsd.com/" },
  { name: "머니박스 용산", area: "용산", origin: "https://www.moneyboxys.com", referer: "https://www.moneyboxys.com/" },
  { name: "머니박스 울산", area: "울산", origin: "http://www.moneyboxulsan.com", referer: "http://www.moneyboxulsan.com/" }
];

app.use(express.static(__dirname));

function num(v) {
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

async function getBranch(branch) {
  const response = await axios.post(API_URL, "cmd=C010", {
    timeout: 15000,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Origin": branch.origin,
      "Referer": branch.referer,
      "User-Agent": "Mozilla/5.0"
    }
  });

  const payload = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error(branch.name + " 데이터 형식 오류");
  }

  return payload.data
    .filter(x => TARGET.includes(x.crc))
    .map(x => {
      const buy = num(x.buy);
      const sell = num(x.sell);
      const base = num(x.base || x.bas);
      return {
        branch: branch.name,
        area: branch.area,
        currency: x.crc,
        buy,
        sell,
        base,
        spread: buy && sell ? buy - sell : null,
        buyDiff: buy && base ? buy - base : null,
        sellDiff: sell && base ? sell - base : null,
        date: payload.dt ? payload.dt[0] : "-",
        source: branch.referer,
        type: "moneybox"
      };
    });
}

async function getJeil() {
  const url = "http://jeilexchange.com/";
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });

  const $ = cheerio.load(response.data);
  const dateText = $(".title_right").first().text().trim() || new Date().toISOString().slice(0, 10);
  const data = [];

  $(".table_line").each((i, el) => {
    const tds = $(el).find("td");
    const currency = $(tds[2]).text().trim();
    const buy = num($(tds[3]).text());
    const sell = num($(tds[4]).text());

    if (!TARGET.includes(currency) || !buy || !sell) return;

    data.push({
      branch: "제일환전",
      area: "명동",
      currency,
      buy,
      sell,
      base: null,
      spread: buy - sell,
      buyDiff: null,
      sellDiff: null,
      date: dateText,
      source: url,
      type: "external"
    });
  });

  if (!data.length) {
    throw new Error("제일환전 데이터 파싱 실패");
  }

  return data;
}

app.get('/api/rates', async (req, res) => {
  const jobs = [
    ...branches.map(branch => ({
      name: branch.name,
      promise: getBranch(branch)
    })),
    {
      name: "제일환전",
      promise: getJeil()
    }
  ];

  const results = await Promise.allSettled(jobs.map(job => job.promise));

  const data = [];
  const errors = [];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      data.push(...r.value);
    } else {
      errors.push(jobs[i].name + ": " + (r.reason && r.reason.message ? r.reason.message : String(r.reason)));
    }
  });

  res.json({
    success: data.length > 0,
    updatedAt: new Date().toLocaleString("ko-KR"),
    currencies: TARGET,
    branchCount: jobs.length,
    data,
    errors
  });
});

app.listen(PORT, () => {
  console.log("실행 완료: http://localhost:" + PORT);
});

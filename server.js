const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;
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
  const n = Number(String(v ?? "").replace(/,/g, "").trim());
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
  if (!payload || !Array.isArray(payload.data)) throw new Error("데이터 형식 오류");
  return payload.data.filter(x => TARGET.includes(x.crc)).map(x => {
    const buy = num(x.buy), sell = num(x.sell), base = num(x.base || x.bas);
    return {
      branch: branch.name, area: branch.area, currency: x.crc,
      buy, sell, base,
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
  const response = await axios.get(url, { timeout: 15000, headers: {"User-Agent":"Mozilla/5.0"} });
  const $ = cheerio.load(response.data);
  const dateText = $(".title_right").first().text().trim() || new Date().toISOString().slice(0,10);
  const data = [];
  $(".table_line").each((i, el) => {
    const tds = $(el).find("td");
    const currency = $(tds[2]).text().trim();
    let buy = num($(tds[3]).text());
    let sell = num($(tds[4]).text());
    if (!TARGET.includes(currency) || buy == null || sell == null) return;

    if (currency === "JPY" && buy > 100) buy = buy / 100;
    if (currency === "JPY" && sell > 100) sell = sell / 100;

    data.push({
      branch:"제일환전", area:"명동", currency, buy, sell, base:null,
      spread: buy - sell, buyDiff:null, sellDiff:null,
      date: dateText, source:url, type:"external"
    });
  });
  if (!data.length) throw new Error("제일환전 데이터 파싱 실패");
  return data;
}

app.get('/api/rates', async (req, res) => {
  const jobs = [...branches.map(branch => ({name:branch.name, promise:getBranch(branch)})), {name:"제일환전", promise:getJeil()}];
  const results = await Promise.allSettled(jobs.map(j => j.promise));
  const data = [], errors = [];
  results.forEach((r,i)=> r.status === "fulfilled" ? data.push(...r.value) : errors.push(jobs[i].name + ": " + (r.reason?.message || String(r.reason))));
  res.json({
    success: data.length > 0,
    updatedAt: new Date().toLocaleString("ko-KR", { timeZone:"Asia/Seoul" }),
    collectedAt: new Date().toISOString(),
    currencies: TARGET,
    branchCount: jobs.length,
    data, errors
  });
});

async function yahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`;
  const r = await axios.get(url, {timeout:10000, headers:{"User-Agent":"Mozilla/5.0"}});
  const result = r.data?.chart?.result?.[0];
  const meta = result?.meta || {};
  const price = meta.regularMarketPrice || meta.previousClose || null;
  const prev = meta.chartPreviousClose || meta.previousClose || null;
  const changePct = price && prev ? ((price - prev) / prev * 100) : null;
  return { price, changePct };
}

async function tradingViewQuotes(symbols) {
  const response = await axios.post("https://scanner.tradingview.com/global/scan", {
    symbols: {
      tickers: symbols,
      query: { types: [] }
    },
    columns: ["close", "change", "change_abs"]
  }, {
    timeout: 10000,
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Content-Type": "application/json"
    }
  });

  const out = {};
  for (const row of (response.data?.data || [])) {
    const symbol = row.s;
    const d = row.d || [];
    out[symbol] = {
      price: d[0] ?? null,
      changePct: d[1] ?? null,
      changeAbs: d[2] ?? null,
      source: "TradingView"
    };
  }
  return out;
}

function firstValid(...items) {
  return items.find(x => x && x.price != null && Number.isFinite(Number(x.price))) || null;
}

function makeValue(price, changePct = null, source = "calculated") {
  return price == null || !Number.isFinite(Number(price))
    ? null
    : { price: Number(price), changePct, source };
}

function parseNumberLoose(value) {
  if (value == null) return null;
  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[^\d.+-]/g, "")
    .trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

async function getInvestingQuote(slug) {
  const urls = [
    `https://kr.investing.com/currencies/${slug}`,
    `https://www.investing.com/currencies/${slug}`
  ];

  let lastError = null;

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        timeout: 12000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          "Referer": "https://kr.investing.com/"
        }
      });

      const html = response.data || "";

      const pricePatterns = [
        /data-test=["']instrument-price-last["'][^>]*>([^<]+)</i,
        /"lastPrice"\s*:\s*"([^"]+)"/i,
        /"last"\s*:\s*"([^"]+)"/i,
        /"last_close"\s*:\s*"([^"]+)"/i,
        /"price"\s*:\s*"([^"]+)"/i
      ];

      const changePatterns = [
        /data-test=["']instrument-price-change-percent["'][^>]*>\s*<span[^>]*>\s*([^<]+)</i,
        /"changePercent"\s*:\s*"([^"]+)"/i,
        /"change_percent"\s*:\s*"([^"]+)"/i
      ];

      let price = null;
      let changePct = null;

      for (const p of pricePatterns) {
        const m = html.match(p);
        if (m) {
          price = parseNumberLoose(m[1]);
          if (price != null) break;
        }
      }

      for (const p of changePatterns) {
        const m = html.match(p);
        if (m) {
          changePct = parseNumberLoose(m[1]);
          if (changePct != null) break;
        }
      }

      if (price != null) {
        return { price, changePct, source: "Investing" };
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(lastError?.message || `Investing parse failed: ${slug}`);
}

async function getInvestingMap() {
  const slugs = {
    usdkrw: "usd-krw",
    jpykrw: "jpy-krw",
    usdjpy: "usd-jpy",
    eurkrw: "eur-krw",
    cnykrw: "cny-krw",
    twdkrw: "twd-krw",
    hkdkrw: "hkd-krw"
  };

  const entries = await Promise.allSettled(
    Object.entries(slugs).map(async ([key, slug]) => [key, await getInvestingQuote(slug)])
  );

  const out = {};
  const errors = [];

  for (const r of entries) {
    if (r.status === "fulfilled") {
      out[r.value[0]] = r.value[1];
    } else {
      errors.push(r.reason?.message || String(r.reason));
    }
  }

  return { out, errors };
}

app.get('/api/markets', async (req,res)=>{
  const errors = [];
  async function safe(name, fn) {
    try { return await fn(); } catch(e) { errors.push(name + ": " + e.message); return null; }
  }

  const tvSymbols = [
    "FX_IDC:USDKRW",
    "FX:USDKRW",
    "FX_IDC:JPYKRW",
    "OANDA:JPYKRW",
    "FOREXCOM:JPYKRW",
    "FX:JPYKRW",
    "FX:USDJPY",
    "TVC:DXY",
    "NYMEX:CL1!",
    "TVC:USOIL",
    "KRX:KOSPI",
    "CBOE:VIX",
    "NASDAQ:IXIC",
    "SP:SPX",
    "TVC:US10Y",
    "FX_IDC:EURKRW",
    "FX:EURKRW",
    "OANDA:EURKRW",
    "FX:EURUSD",
    "FX_IDC:CNYKRW",
    "FX:CNYKRW",
    "FX:USDCNH",
    "FX:USDCNY",
    "FX_IDC:TWDKRW",
    "FX:TWDKRW",
    "FX_IDC:USDTWD",
    "FX:USDTWD",
    "FX_IDC:HKDKRW",
    "FX:HKDKRW",
    "FX:USDHKD"
  ];

  const tv = await safe("TradingView", () => tradingViewQuotes(tvSymbols)) || {};
  const investingResult = await safe("Investing", () => getInvestingMap());
  const investing = investingResult?.out || {};
  if (investingResult?.errors?.length) errors.push(...investingResult.errors.map(e => "Investing item: " + e));

  const tvUsdkrw = firstValid(tv["FX_IDC:USDKRW"], tv["FX:USDKRW"]);
  const tvJpyRaw = firstValid(tv["FX_IDC:JPYKRW"], tv["OANDA:JPYKRW"], tv["FOREXCOM:JPYKRW"], tv["FX:JPYKRW"]);
  const tvJpykrw = tvJpyRaw?.price ? { ...tvJpyRaw, price: tvJpyRaw.price * 100, source: `${tvJpyRaw.source} ×100` } : null;
  const tvUsdjpy = firstValid(tv["FX:USDJPY"]);

  const usdkrw = firstValid(investing.usdkrw, tvUsdkrw);
  const jpykrw = firstValid(investing.jpykrw, tvJpykrw);
  const usdjpy = firstValid(investing.usdjpy, tvUsdjpy);

  const wti = firstValid(tv["NYMEX:CL1!"], tv["TVC:USOIL"]);
  const dxy = firstValid(tv["TVC:DXY"]);
  const kospi = firstValid(tv["KRX:KOSPI"]);
  const vix = firstValid(tv["CBOE:VIX"]);
  const nasdaq = firstValid(tv["NASDAQ:IXIC"]);
  const sp500 = firstValid(tv["SP:SPX"]);
  const us10y = firstValid(tv["TVC:US10Y"]);

  const eurDirect = firstValid(investing.eurkrw, tv["FX_IDC:EURKRW"], tv["FX:EURKRW"], tv["OANDA:EURKRW"]);
  const eurkrw = eurDirect || makeValue(
    usdkrw?.price && tv["FX:EURUSD"]?.price ? usdkrw.price * tv["FX:EURUSD"].price : null,
    null,
    "USDKRW × EURUSD"
  );

  const cnyDirect = firstValid(investing.cnykrw, tv["FX_IDC:CNYKRW"], tv["FX:CNYKRW"]);
  const usdcnh = firstValid(tv["FX:USDCNH"], tv["FX:USDCNY"]);
  const cnykrw = cnyDirect || makeValue(
    usdkrw?.price && usdcnh?.price ? usdkrw.price / usdcnh.price : null,
    null,
    "USDKRW ÷ USDCNH"
  );

  const twdDirect = firstValid(investing.twdkrw, tv["FX_IDC:TWDKRW"], tv["FX:TWDKRW"]);
  const usdtwd = firstValid(tv["FX_IDC:USDTWD"], tv["FX:USDTWD"]);
  const twdkrw = twdDirect || makeValue(
    usdkrw?.price && usdtwd?.price ? usdkrw.price / usdtwd.price : null,
    null,
    "USDKRW ÷ USDTWD"
  );

  const hkdDirect = firstValid(investing.hkdkrw, tv["FX_IDC:HKDKRW"], tv["FX:HKDKRW"]);
  const usdhkd = firstValid(tv["FX:USDHKD"]);
  const hkdkrw = hkdDirect || makeValue(
    usdkrw?.price && usdhkd?.price ? usdkrw.price / usdhkd.price : null,
    null,
    "USDKRW ÷ USDHKD"
  );

  const usdt = await safe("USDT", async () => {
    const r = await axios.get("https://api.upbit.com/v1/ticker?markets=KRW-USDT", {timeout:10000});
    const price = r.data?.[0]?.trade_price || null;
    return { price, changePct: null, source: "Upbit" };
  });

  const upbit = await safe("Upbit BTC", async ()=>{
    const r = await axios.get("https://api.upbit.com/v1/ticker?markets=KRW-BTC", {timeout:10000});
    return r.data?.[0]?.trade_price || null;
  });

  const binance = await safe("Binance BTC", async ()=>{
    const r = await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", {timeout:10000});
    return Number(r.data?.price) || null;
  });

  let kimchi = null;
  const usdkrwPrice = usdkrw?.price || null;
  if (upbit && binance && usdkrwPrice) {
    const globalKrw = binance * usdkrwPrice;
    const premium = (upbit - globalKrw) / globalKrw * 100;
    kimchi = { premium, diff: upbit - globalKrw, upbit, binance, usdkrw: usdkrwPrice, globalKrw };
  }

  res.json({
    success: true,
    updatedAt: new Date().toLocaleString("ko-KR", { timeZone:"Asia/Seoul" }),
    source: "Investing priority + TradingView fallback + Upbit + Binance",
    indicators: {
      usdkrw, jpykrw, usdjpy, usdt,
      wti, dxy, kospi, vix, nasdaq, sp500, us10y,
      eurkrw, cnykrw, twdkrw, hkdkrw,
      kimchi
    },
    errors
  });
});

app.listen(PORT, () => console.log("실행 완료: http://localhost:" + PORT));

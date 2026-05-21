import { NextResponse } from "next/server";

type CoinGeckoMarket = {
  current_price: number;
  price_change_percentage_24h: number;
  last_updated: string;
};

type PricePayload = {
  priceUsd: number;
  change24h: number;
  mood: "up" | "down";
  lastUpdated: string;
  cachedAt: string;
  isStale?: boolean;
};

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&price_change_percentage=24h";

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedPrice: PricePayload | null = null;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (
      cachedPrice &&
      Date.now() - new Date(cachedPrice.cachedAt).getTime() < CACHE_TTL_MS
    ) {
      return NextResponse.json(cachedPrice);
    }

    const response = await fetch(COINGECKO_URL, {
      headers: {
        accept: "application/json",
        "user-agent": "air-do-shocair/0.1",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`CoinGecko responded with ${response.status}`);
    }

    const payload = (await response.json()) as CoinGeckoMarket[];
    const bitcoin = payload[0];

    if (
      !bitcoin ||
      typeof bitcoin.current_price !== "number" ||
      typeof bitcoin.price_change_percentage_24h !== "number"
    ) {
      throw new Error("CoinGecko response did not include Bitcoin market data.");
    }

    cachedPrice = {
      priceUsd: bitcoin.current_price,
      change24h: bitcoin.price_change_percentage_24h,
      mood: bitcoin.price_change_percentage_24h >= 0 ? "up" : "down",
      lastUpdated: bitcoin.last_updated,
      cachedAt: new Date().toISOString(),
    };

    return NextResponse.json(cachedPrice);
  } catch (error) {
    console.error("Failed to fetch Bitcoin price", error);

    if (cachedPrice) {
      return NextResponse.json({
        ...cachedPrice,
        isStale: true,
      });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to fetch Bitcoin price.",
      },
      { status: 502 },
    );
  }
}

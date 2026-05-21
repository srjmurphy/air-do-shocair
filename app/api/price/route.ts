import { NextResponse } from "next/server";

type CoinGeckoMarket = {
  current_price: number;
  price_change_percentage_24h: number;
  last_updated: string;
};

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&price_change_percentage=24h";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(COINGECKO_URL, {
      headers: {
        accept: "application/json",
        "user-agent": "air-do-shocair/0.1",
      },
      next: { revalidate: 60 },
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

    return NextResponse.json({
      priceUsd: bitcoin.current_price,
      change24h: bitcoin.price_change_percentage_24h,
      mood: bitcoin.price_change_percentage_24h >= 0 ? "up" : "down",
      lastUpdated: bitcoin.last_updated,
    });
  } catch (error) {
    console.error("Failed to fetch Bitcoin price", error);

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


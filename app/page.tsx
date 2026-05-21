"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mood = "up" | "down";

type PricePayload = {
  priceUsd: number;
  change24h: number;
  mood: Mood;
  lastUpdated: string;
  cachedAt?: string;
  isStale?: boolean;
};

type VistaPayload = {
  imageUrl: string;
  prompt: string;
  mood: Mood;
  generatedAt: string;
};

type DashboardState = {
  price: PricePayload | null;
  vista: VistaPayload | null;
  loading: boolean;
  generatingVista: boolean;
  error: string | null;
};

const initialState: DashboardState = {
  price: null,
  vista: null,
  loading: true,
  generatingVista: false,
  error: null,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export default function Home() {
  const [state, setState] = useState<DashboardState>(initialState);
  const hasLoadedPrice = useRef(false);

  const loadPrice = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: !current.price,
      error: null,
    }));

    try {
      const price = await fetchJson<PricePayload>("/api/price");

      setState((current) => ({
        ...current,
        price,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while reading the markets.",
      }));
    }
  }, []);

  const generateVista = useCallback(async () => {
    setState((current) => ({
      ...current,
      generatingVista: true,
      error: null,
    }));

    try {
      const price = state.price ?? (await fetchJson<PricePayload>("/api/price"));
      const vista = await fetchJson<VistaPayload>(`/api/vista?mood=${price.mood}`);

      setState((current) => ({
        ...current,
        price,
        vista,
        loading: false,
        generatingVista: false,
        error: null,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        generatingVista: false,
        error:
          error instanceof Error
            ? error.message
            : "Today's vista could not be generated.",
      }));
    }
  }, [state.price]);

  useEffect(() => {
    if (hasLoadedPrice.current) {
      return;
    }

    hasLoadedPrice.current = true;
    void loadPrice();
  }, [loadPrice]);

  const moodCopy = useMemo(() => {
    const mood = state.price?.mood ?? "up";

    return mood === "up"
      ? {
          eyebrow: "The market lifts",
          title: "Sun on the glen.",
          verse:
            "Bitcoin is walking the high road today; raise the amber glass and let the hills carry the noise away.",
          badge: "Up day",
          accent: "text-malt",
          ring: "border-amber/50 bg-amber/15",
        }
      : {
          eyebrow: "The market steadies",
          title: "Mist on the peaks.",
          verse:
            "Bitcoin is weathering rough air; pour slow, stand firm, and let the old mountains keep the measure.",
          badge: "Down day",
          accent: "text-lichen",
          ring: "border-lichen/50 bg-lichen/15",
        };
  }, [state.price?.mood]);

  const showSkeleton = state.loading && !state.vista;

  return (
    <main className="relative min-h-screen overflow-hidden bg-peat text-stone-50">
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: state.vista?.imageUrl
            ? `url(${state.vista.imageUrl})`
            : undefined,
          opacity: state.vista?.imageUrl ? 1 : 0,
        }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,15,12,0.96)_0%,rgba(18,15,12,0.74)_38%,rgba(18,15,12,0.18)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(18,15,12,0.92)_0%,rgba(18,15,12,0.18)_45%,rgba(18,15,12,0.74)_100%)]" />

      <section className="relative z-10 flex min-h-screen flex-col px-5 py-5 sm:px-8 lg:px-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.38em] text-amber/80">
              Air Do Shocair
            </p>
            <p className="mt-2 text-sm text-stone-300">
              Gabh air do shocair (take it easy)
            </p>
          </div>

          <button
            type="button"
            onClick={() => void generateVista()}
            disabled={state.loading || state.generatingVista}
            className="rounded-full border border-amber/40 bg-peat/55 px-5 py-3 text-sm font-semibold text-malt shadow-ember backdrop-blur transition hover:border-malt hover:bg-amber/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.generatingVista
              ? "Calling the hills..."
              : state.vista
                ? "Regenerate vista"
                : "Generate vista"}
          </button>
        </header>

        <div className="grid flex-1 items-end gap-10 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:py-14">
          <div className="max-w-5xl">
            <div
              className={`mb-7 inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur ${moodCopy.ring}`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-current shadow-[0_0_22px_currentColor]" />
              {moodCopy.badge}
            </div>

            <p className="mb-4 text-sm uppercase tracking-[0.34em] text-stone-300">
              {moodCopy.eyebrow}
            </p>

            <h1 className="max-w-4xl font-display text-6xl font-semibold leading-[0.9] text-stone-50 sm:text-7xl lg:text-8xl">
              {moodCopy.title}
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-200 sm:text-xl">
              {moodCopy.verse}
            </p>

            {state.error ? (
              <div className="mt-8 max-w-2xl rounded-md border border-red-300/30 bg-red-950/35 p-4 text-sm text-red-100 backdrop-blur">
                {state.error}
              </div>
            ) : null}
          </div>

          <aside className="w-full max-w-xl justify-self-start rounded-lg border border-white/12 bg-black/32 p-5 shadow-2xl backdrop-blur-md lg:justify-self-end">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-sm text-stone-300">Bitcoin live price</p>
                <p className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {state.price ? formatCurrency(state.price.priceUsd) : "Loading"}
                </p>
              </div>
              <div className={`text-right ${moodCopy.accent}`}>
                <p className="text-sm text-stone-300">24h</p>
                <p className="mt-2 text-2xl font-black">
                  {state.price
                    ? `${state.price.change24h >= 0 ? "+" : ""}${state.price.change24h.toFixed(2)}%`
                    : "--"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 pt-5 text-sm text-stone-300 sm:grid-cols-2">
              <div>
                <p className="text-stone-500">Market reading</p>
                <p className="mt-1 font-semibold text-stone-100">
                  {state.price?.mood === "down"
                    ? "Misty, resilient"
                    : "Bright, triumphant"}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Last update</p>
                <p className="mt-1 font-semibold text-stone-100">
                  {state.price ? formatDate(state.price.lastUpdated) : "--"}
                </p>
                {state.price?.isStale ? (
                  <p className="mt-1 text-xs text-malt">
                    Cached while CoinGecko is rate-limiting.
                  </p>
                ) : null}
              </div>
            </div>

            {state.vista?.prompt ? (
              <p className="mt-5 line-clamp-3 border-t border-white/10 pt-5 text-sm italic leading-6 text-stone-300">
                {state.vista.prompt}
              </p>
            ) : state.price ? (
              <p className="mt-5 border-t border-white/10 pt-5 text-sm leading-6 text-stone-300">
                Price loaded. Generate today&apos;s vista when you&apos;re ready to
                call OpenAI.
              </p>
            ) : null}
          </aside>
        </div>
      </section>

      {showSkeleton ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-peat/88 px-6 text-center backdrop-blur-sm">
          <div>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-amber/20 border-t-malt" />
            <p className="mt-5 font-display text-3xl text-malt">
              Reading the market weather...
            </p>
            <p className="mt-2 text-sm text-stone-300">
              Fetching Bitcoin. Vista generation waits for your click.
            </p>
          </div>
        </div>
      ) : null}

      {state.generatingVista ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-peat/78 px-6 text-center backdrop-blur-sm">
          <div>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-amber/20 border-t-malt" />
            <p className="mt-5 font-display text-3xl text-malt">
              Calling the Highland seer...
            </p>
            <p className="mt-2 text-sm text-stone-300">
              This is the paid OpenAI image-generation step.
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}

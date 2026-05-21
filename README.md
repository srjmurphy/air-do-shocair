# Air Do Shocair

**Air Do Shocair** is a Next.js 15 portfolio app that turns the daily Bitcoin market mood into a cinematic Scottish Highland dashboard.

The app fetches the live Bitcoin price and 24-hour movement from CoinGecko, interprets that as an `up` or `down` mood, asks OpenAI to write a poetic image-generation prompt, then generates a Highland vista with a whisky dram using `gpt-image-1.5`.

Tagline:

> Air Do Shocair - Gabh air do shocair (take it easy)

## What We Built

This repository contains a complete, ready-to-run web app with:

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Server-side API routes for price and image generation
- Client-side dashboard UI
- OpenAI Responses API prompt crafting
- OpenAI image generation with `gpt-image-1.5`
- CoinGecko live Bitcoin price data
- Local `.env.local` support for private API keys
- ESLint and production build verification

The finished app lives in:

```text
/app
  /api
    /price/route.ts
    /vista/route.ts
  globals.css
  layout.tsx
  page.tsx
```

## Product Concept

The app is intentionally simple on the surface: it answers one question beautifully.

> Is Bitcoin up or down today, and what Highland weather does that feel like?

If Bitcoin is up, the UI presents a triumphant sunny glen and celebratory whisky dram.

If Bitcoin is down, the UI shifts to misty resilient peaks and a steadying pour of whisky.

This gives the dashboard a strong emotional identity rather than showing raw market data alone. The Gaelic phrase "Gabh air do shocair" means "take it easy", which gives the app its tone: market-aware, calm, and poetic.

## Why Next.js 15

Next.js 15 was chosen because it is a strong fit for a modern portfolio app that needs both frontend polish and secure server-side integration.

The App Router gives a clean split between:

- `app/page.tsx` for the interactive dashboard
- `app/api/price/route.ts` for market data
- `app/api/vista/route.ts` for OpenAI calls

This matters because the OpenAI API key must never be exposed in browser JavaScript. By keeping OpenAI calls inside a server route, the client can request a generated vista without seeing the secret key.

Next.js also gives a straightforward production path for deployment to Vercel or any Node-compatible host.

## Why TypeScript

TypeScript was used to make the API contracts explicit.

For example, the dashboard models the Bitcoin response as:

```ts
type PricePayload = {
  priceUsd: number;
  change24h: number;
  mood: "up" | "down";
  lastUpdated: string;
};
```

That keeps the client, API routes, and UI states aligned. For an interview portfolio, this also demonstrates that the code is not just visually polished, but structured with maintainability in mind.

## Why Tailwind CSS

Tailwind was chosen because it works well for fast, highly controlled interface design without creating extra component or stylesheet overhead.

The UI needed:

- A full-screen hero dashboard
- Dark Highland-inspired visual mood
- Amber whisky accents
- Large expressive typography
- Responsive mobile layout
- Overlay gradients for readable text over generated images

Tailwind makes those details visible at the component level while keeping the app small.

The theme is extended in `tailwind.config.ts` with project-specific colors:

```ts
colors: {
  peat: "#120f0c",
  heather: "#6f5b8b",
  amber: "#d39a2d",
  malt: "#f0c66d",
  lichen: "#9caf88",
}
```

These names reinforce the Scottish visual language and make the UI classes more meaningful.

## Why CoinGecko

CoinGecko was used for Bitcoin pricing because it provides a simple public market endpoint that can return:

- Current BTC price in USD
- 24-hour percentage change
- Last updated timestamp

The app calls:

```text
https://api.coingecko.com/api/v3/coins/markets
```

with:

```text
vs_currency=usd
ids=bitcoin
price_change_percentage=24h
```

That gives the app enough data to decide whether the day is an `up` day or a `down` day.

## OpenAI Functionality Used

The app uses OpenAI in two steps.

### 1. Responses API for Prompt Crafting

The route `app/api/vista/route.ts` first calls the OpenAI Responses API.

The purpose is not to generate the image directly. Instead, it asks a language model to act as a Highland seer and create a rich image-generation prompt.

This system prompt is used:

```text
You are a Highland seer composing image prompts for a Scottish Bitcoin dashboard called Air Do Shocair.
Write one rich, cinematic image prompt. The image must feel like the Scottish Highlands, poetic but concrete, photorealistic, and suitable for a full-screen hero dashboard.
Include a whisky dram as a small but clear foreground detail. Avoid text, logos, UI, people, and brand names.
```

The app then passes a mood-specific user message:

- Up day: triumphant sunny Highland glen with celebratory whisky dram
- Down day: misty resilient Highland peaks with a steadying pour of whisky

This two-step pattern is useful because it lets a text model enrich the scene before image generation. Rather than hard-coding one generic prompt, the app uses OpenAI to create a more detailed visual brief.

### 2. `gpt-image-1.5` for Vista Generation

After the prompt is crafted, the app calls OpenAI image generation:

```ts
await openai.images.generate({
  model: "gpt-image-1.5",
  prompt: vividPrompt,
  n: 1,
  size: "1536x1024",
  quality: "high",
  output_format: "jpeg",
});
```

The image is returned as base64 and converted into a browser-renderable data URL:

```ts
imageUrl: `data:image/jpeg;base64,${base64Image}`
```

That means the app does not need separate image storage for the portfolio demo. The generated image can be rendered immediately by the dashboard.

### Note on Image Size

The original idea specified `1792x1024`. Current OpenAI image-generation support for `gpt-image-1.5` uses `1536x1024` as the suitable landscape size, so the implementation uses that supported size for reliability.

The requested vivid look is handled through the prompt itself:

```text
vivid color grade, 35mm full-frame photography, high dynamic range, tactile weather, amber highlights, cinematic depth
```

## API Route Details

### `app/api/price/route.ts`

This route:

1. Calls CoinGecko.
2. Extracts BTC price and 24-hour change.
3. Converts the market movement into a mood:

```ts
mood: bitcoin.price_change_percentage_24h >= 0 ? "up" : "down"
```

4. Returns JSON to the frontend.

Example response:

```json
{
  "priceUsd": 77189,
  "change24h": -0.3,
  "mood": "down",
  "lastUpdated": "2026-05-21T12:04:00.000Z"
}
```

The route includes error handling so the frontend can show a useful message if CoinGecko is unavailable.

### `app/api/vista/route.ts`

This route:

1. Reads `mood` from the query string.
2. Checks that `OPENAI_API_KEY` is configured.
3. Uses the Responses API to craft a poetic Highland prompt.
4. Sends that prompt to `gpt-image-1.5`.
5. Returns the generated image URL and crafted prompt.

It also contains a fallback prompt generator, so even if prompt crafting fails in future refactors, the route has a clear backup concept for each market mood.

## Frontend Details

The dashboard in `app/page.tsx` is a client component because it handles:

- Loading state
- Refresh button state
- Fetching live price data
- Fetching the generated vista
- Displaying API errors
- Rendering mood-dependent copy

The visual design uses:

- Full-screen background image
- Layered dark gradient overlays
- Large serif hero typography
- Amber and lichen mood accents
- A glassy price card
- Mobile-first responsive layout

The page intentionally keeps the generated image as the main visual artifact. The UI sits over it rather than competing with it.

## Error Handling

The app handles several practical failure modes:

- CoinGecko failure
- Missing OpenAI key
- Placeholder OpenAI key still present
- OpenAI image generation failure
- Partial success where price loads but vista generation fails

One important improvement made during verification was separating the price fetch from the vista fetch. That way, if OpenAI fails because no real key has been added yet, the dashboard still shows live Bitcoin data instead of staying stuck in a loading state.

## Local Setup

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run linting:

```bash
npm run lint
```

Run a production build:

```bash
npm run build
```

Start the production build:

```bash
npm run start
```

## Environment Variables

Create or edit `.env.local`:

```bash
OPENAI_API_KEY=sk-your-real-key
```

The file is intentionally ignored by Git so secrets are not pushed to GitHub.

For deployment, add the same value as an environment variable in the hosting provider, for example Vercel project settings.

## Git and GitHub Steps We Followed

The local project folder was initially named:

```text
airdoshocair
```

The GitHub repository was named:

```text
air-do-shocair
```

That is fine. The local folder name and remote repository name do not have to match.

The remote was configured as:

```bash
git remote add origin https://github.com/srjmurphy/air-do-shocair.git
```

When GitHub rejected password authentication, we avoided granting broad VS Code OAuth organization access and instead used terminal Git authentication.

The key point was that GitHub no longer accepts account passwords for Git over HTTPS. It requires one of:

- GitHub CLI authentication
- SSH keys
- A personal access token

Because VS Code OAuth requested access that included the `getsynq` organization, we avoided that path and pushed with Git credentials directly.

After authentication was fixed, GitHub rejected the first push because the remote already contained initial files from repo creation. We integrated those remote commits with:

```bash
git pull --rebase origin main
```

Then pushed successfully:

```bash
git push -u origin main
```

Future pushes can now use:

```bash
git add .
git commit -m "Describe the change"
git push
```

## Files Worth Reviewing

### `app/api/price/route.ts`

Best place to review how external market data is fetched and normalized.

### `app/api/vista/route.ts`

Best place to review the OpenAI integration. This contains both the Responses API prompt-crafting step and the image-generation step.

### `app/page.tsx`

Best place to review client-side state management, loading states, mood-specific copy, and the full-screen dashboard UI.

### `tailwind.config.ts`

Best place to review the custom Scottish-inspired theme tokens.

## Production Considerations

For a production version, the next improvements would be:

- Cache generated vistas by date and mood to avoid regenerating on every refresh.
- Store generated images in object storage instead of returning base64 data URLs.
- Add rate limiting to `/api/vista`.
- Add a retry strategy for transient OpenAI or CoinGecko failures.
- Add a deployment-specific image cache.
- Add observability for API latency and generation failures.
- Add a manual "regenerate vista" control separate from "refresh price".

Those were intentionally left out of the first version to keep the portfolio app focused, readable, and easy to run locally.

## Current Status

The app has been verified with:

```bash
npm run lint
npm run build
```

Both commands pass.

The repository has been pushed to:

```text
https://github.com/srjmurphy/air-do-shocair
```


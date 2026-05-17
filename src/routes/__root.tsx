import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Moo Chapatis",
  description: "Fresh hot chapatis delivered fast in Kitengela, Kenya. Order 7PM–10PM daily.",
  servesCuisine: "Kenyan",
  telephone: "+254718357737",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kitengela",
    addressRegion: "Kajiado",
    addressCountry: "KE",
  },
  openingHours: "Mo-Su 19:00-22:00",
  priceRange: "KSh",
  areaServed: "Kitengela",
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { name: "theme-color", content: "#ff6b1a" },
      { title: "Moo Chapatis — Fresh Hot Chapatis Delivered Fast in Kitengela" },
      {
        name: "description",
        content:
          "Order fresh hot chapatis delivered to your door in Kitengela, Kenya. Daily delivery 7PM–10PM. Call or WhatsApp 0718357737.",
      },
      {
        name: "keywords",
        content:
          "chapati delivery Kitengela, Moo Chapatis, food delivery Kitengela, Kenyan chapatis, fresh chapatis Kenya, chapati Athi River, chapati EPZ, order chapati online Kenya",
      },
      { name: "author", content: "Moo Chapatis" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "geo.region", content: "KE-45" },
      { name: "geo.placename", content: "Kitengela" },

      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Moo Chapatis" },
      { property: "og:title", content: "Moo Chapatis — Fresh Hot Chapatis Delivered Fast" },
      {
        property: "og:description",
        content: "Order fresh hot chapatis in Kitengela. Delivery 7PM–10PM. WhatsApp 0718357737.",
      },
      { property: "og:locale", content: "en_KE" },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Moo Chapatis — Order, We Deliver" },
      { name: "twitter:description", content: "Fresh hot chapatis delivered fast in Kitengela." },

      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Moo Chapatis" },
      { name: "format-detection", content: "telephone=yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.ico" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(orgJsonLd),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}

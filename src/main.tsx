import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import React, { StrictMode, useEffect, lazy, useRef, useState, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Browse = lazy(() => import("./pages/Browse.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="nb flex size-12 items-center justify-center bg-primary">
        <span className="nb-display text-xl">B</span>
      </div>
      <div className="h-3 w-40 animate-pulse border-2 border-border bg-muted" />
    </div>
  );
}

/** Fires onReady once the first route has committed, hiding the splash. */
function SplashBridge({ onReady }: { onReady: () => void }) {
  const location = useLocation();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    // One paint of delay so the first route is actually on screen.
    requestAnimationFrame(() => onReady());
  }, [location.pathname, onReady]);
  return null;
}

const routeTitles: Record<string, string> = {
  "/": "Blitex APKs — checked Android apps, updated daily",
  "/apps": "Browse the catalog — Blitex APKs",
  "/auth": "Admin sign-in — Blitex APKs",
  "/admin": "Control — Blitex APKs",
};

/** Per-route document titles and scroll-to-top on navigation. */
function RouteChrome() {
  const location = useLocation();
  useEffect(() => {
    document.title =
      routeTitles[location.pathname] ?? "Blitex APKs — checked Android apps";
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}

/**
 * Optional editor toolbar. Loaded dynamically so a fresh clone of the repo
 * still builds and runs if this file is absent (it is editor-only, never
 * shown to site visitors on the deployed site).
 */
function OptionalToolbar() {
  const [Toolbar, setToolbar] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    let alive = true;
    import("../vly-toolbar-readonly.tsx")
      .then((mod) => {
        if (alive) setToolbar(() => mod.VlyToolbar);
      })
      .catch(() => {
        // File not present in this environment — the toolbar is optional.
      });
    return () => {
      alive = false;
    };
  }, []);
  return Toolbar ? <Toolbar /> : null;
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in the browser runtime). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * The Convex deployment URL. The baked-in default points at this project's own
 * deployment, so hosting (Netlify etc.) needs NO environment variable at all.
 * Set VITE_CONVEX_URL only if you ever migrate to a different deployment.
 */
const CONVEX_URL =
  (import.meta.env.VITE_CONVEX_URL as string | undefined) ??
  "https://friendly-stoat-539.convex.cloud";

/** Shown when the deployment is missing its backend URL. */
function MissingBackendUrl() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 nb-grid-bg">
      <div className="nb-lg w-full max-w-md bg-card p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center border-2 border-border bg-primary">
          <span className="nb-display text-xl">B</span>
        </div>
        <h1 className="nb-display mt-4 text-xl">Setup needed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The site is deployed but its backend address isn't configured yet.
        </p>
        <p className="mt-4 border-2 border-dashed border-border bg-background p-3 text-left text-xs leading-relaxed text-muted-foreground">
          In your hosting dashboard, add the environment variable{" "}
          <code className="bg-muted px-1 font-bold">VITE_CONVEX_URL</code> with
          your Convex deployment URL, then redeploy. Full steps are in the
          README.md file that came with this project.
        </p>
      </div>
    </div>
  );
}

const convex = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;



function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


/** Removes the pre-JS splash from index.html once the app has mounted. */
function dismissSplash() {
  const splash = document.getElementById("splash");
  if (!splash) return;
  splash.classList.add("splash-done");
  window.setTimeout(() => splash.remove(), 400);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
      >
      <ToolbarErrorBoundary>
        <OptionalToolbar />
      </ToolbarErrorBoundary>
      {convex ? (
        <ConvexAuthProvider client={convex}>
          <BrowserRouter>
            <RouteSyncer />
            <SplashBridge onReady={dismissSplash} />
            <RouteChrome />
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route
                  path="/auth"
                  element={<AuthPage redirectAfterAuth="/admin" />}
                />
                <Route path="/apps" element={<Browse />} />
                <Route
                  path="/admin"
                  element={
                    <RequireAuth>
                      <Admin />
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster />
        </ConvexAuthProvider>
      ) : (
        <MissingBackendUrl />
      )}
      </ThemeProvider>
    </RootErrorBoundary>
  </StrictMode>,
);

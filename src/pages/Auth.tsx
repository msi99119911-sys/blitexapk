import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { NbLogo } from "@/components/nb";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/admin",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

/**
 * Standalone admin sign-in. Deliberately isolated from the public site:
 * email-code entry only (no guest mode), its own dark console styling, and
 * no navigation back into the customer pages.
 */
function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send the code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("That code is incorrect. Please check and try again.");
      setIsLoading(false);
      setOtp("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-foreground p-6 text-background nb-grid-bg-dark">
      <main className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <NbLogo />
          <span className="nb-display text-lg">
            BLITEX APKs <span className="text-primary">· CONTROL</span>
          </span>
        </div>

        <div className="nb-lg bg-card p-8 text-foreground">
          {step === "signIn" ? (
            <>
              <h2 className="nb-display text-2xl">Admin sign-in</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter the admin email. We'll email you a 6-digit access code.
              </p>
              <form onSubmit={handleEmailSubmit} className="mt-6">
                <label
                  htmlFor="auth-email"
                  className="text-xs font-extrabold uppercase tracking-widest"
                >
                  Email
                </label>
                <div className="mt-1.5 flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="auth-email"
                      name="email"
                      type="email"
                      required
                      disabled={isLoading}
                      placeholder="admin@yourdomain.com"
                      className="h-10 w-full border-2 border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:bg-primary/10"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex h-10 w-11 items-center justify-center border-2 border-border bg-primary transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 border-2 border-border bg-destructive px-3 py-2 text-xs font-bold text-white">
                    {error}
                  </p>
                )}
              </form>

              <p className="mt-6 border-t-2 border-dashed border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                This console manages the Blitex catalog. Customer downloads
                never require an account.
              </p>
            </>
          ) : (
            <>
              <h2 className="nb-display text-2xl">Enter access code</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sent to{" "}
                <span className="font-bold text-foreground">{step.email}</span>
                .
              </p>
              <form onSubmit={handleOtpSubmit} className="mt-6">
                <input type="hidden" name="email" value={step.email} />
                <input type="hidden" name="code" value={otp} />

                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                        const form = (e.target as HTMLElement).closest("form");
                        form?.requestSubmit();
                      }
                    }}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (
                  <p className="mt-4 border-2 border-border bg-destructive px-3 py-2 text-center text-xs font-bold text-white">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 border-2 border-border bg-primary px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Verify code
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("signIn")}
                  disabled={isLoading}
                  className="mt-2 w-full border-2 border-border bg-card px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide transition-colors hover:bg-muted disabled:opacity-60"
                >
                  Use a different email
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] font-bold uppercase tracking-widest text-background/60">
          Blitex APKs · Restricted area · Admin access only
        </p>
      </main>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      <Auth {...props} />
    </Suspense>
  );
}

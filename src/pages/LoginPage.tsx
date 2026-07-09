import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function LoginPage() {
  const { signIn, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  // Once a user is signed in, move on to their dashboard.
  useEffect(() => {
    if (!loading && user) {
      navigate("/admin", { replace: true });
    }
  }, [loading, user, navigate]);

  async function handleGoogle() {
    setError(null);
    setGooglePending(true);
    try {
      await signInWithGoogle();
    } catch {
      setError("Could not sign in with Google. Please try again.");
    } finally {
      setGooglePending(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      setError("Could not sign in. Check your email and password.");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-bronze/30";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-ink px-12 py-14 text-paper lg:flex lg:flex-col lg:items-center lg:justify-center lg:text-center">
        <div className="beacon-grid opacity-40" aria-hidden="true" />
        <div className="relative w-full max-w-[30rem]">
          <Logo
            variant="full"
            tone="onDark"
            className="mx-auto !w-full h-auto"
          />
        </div>
        <div className="relative mt-10 max-w-md">
          <h2 className="font-display text-[clamp(2rem,3vw,2.9rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-balance">
            Clarity drives extraordinary results.
          </h2>
          <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-white/70">
            One elegant page for your professional details, with a vCard download
            and QR codes. Sign in to create and manage your cards.
          </p>
        </div>
        <p className="relative mt-10 text-xs text-white/45">
          &copy; {new Date().getFullYear()} Beacon
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center bg-cream px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo variant="full" tone="onLight" className="h-12 w-auto" />
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-ink">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Create and manage your business cards.
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googlePending}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-cream disabled:opacity-60"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
              />
            </svg>
            {googlePending ? "Signing in..." : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">
              or
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-60"
            >
              {pending ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

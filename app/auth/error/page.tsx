import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div>
          <h1 className="text-4xl font-bold text-primary neon-text font-display">
            Authentication Error
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Something went wrong during authentication.
          </p>
        </div>

        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-6">
          <p className="text-sm text-red-500">
            We couldn&apos;t complete your sign-in. This could be due to an
            expired link or an error in the authentication process.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:neon-glow-subtle"
          >
            Try Logging In Again
          </Link>

          <Link
            href="/auth/signup"
            className="block w-full rounded-lg border border-primary/30 px-4 py-3 font-bold text-primary transition-all hover:bg-primary/10"
          >
            Create a New Account
          </Link>
        </div>
      </div>
    </div>
  );
}


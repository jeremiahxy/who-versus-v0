import { AuthForm } from "@/components/auth-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AuthForm mode="login" searchParams={searchParams} />
    </div>
  );
}


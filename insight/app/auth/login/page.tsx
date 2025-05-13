import { SignIn } from "@/components/auth/SignIn";

export default function LoginPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const error = typeof searchParams?.error === 'string' ? searchParams?.error : undefined;
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn providers={['google', 'credentials']} error={error} />
    </div>
  );
}

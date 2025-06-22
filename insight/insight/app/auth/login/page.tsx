import { SignIn } from "@/components/auth/SignIn";

export default async function LoginPage({
  searchParams: searchParamsPromise,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined } | undefined>;
}) {
  const searchParams = searchParamsPromise ? await searchParamsPromise : undefined;
  const error = typeof searchParams?.error === 'string' ? searchParams?.error : undefined;
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn providers={['google', 'credentials']} error={error} />
    </div>
  );
}

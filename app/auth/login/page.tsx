import { SignIn } from "@/components/auth/SignIn";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn providers={['google', 'credentials']} />
    </div>
  );
}

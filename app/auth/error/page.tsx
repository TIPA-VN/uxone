import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthError({
  searchParams,
}: {
  searchParams: { error: string };
}) {
  const error = searchParams?.error || "An error occurred";

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "CredentialsSignin":
        return "Invalid username or password";
      case "AccessDenied":
        return "You do not have permission to access this resource";
      case "Verification":
        return "The verification link is invalid or has expired";
      default:
        return "An unexpected error occurred";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
        <div className="text-red-500 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-6">{getErrorMessage(error)}</p>
        <Button asChild className="w-full">
          <Link href="/auth/signin">Try Again</Link>
        </Button>
      </div>
    </div>
  );
} 
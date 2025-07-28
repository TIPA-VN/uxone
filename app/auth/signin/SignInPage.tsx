// app/auth/signin/SignInPage.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInInput, signInSchema } from "@/lib/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    try {
      setLoading(true);

      const result = await signIn("credentials", {
        redirect: false,
        username: data.username,
        password: data.password,
      });

      if (!result?.error) {
        // Get the user's department home page from the session
        const response = await fetch('/api/auth/session');
        const sessionData = await response.json();
        
        if (sessionData?.user?.department) {
          const { getUserHomePage } = await import('@/config/app');
          const userHomePage = getUserHomePage(sessionData.user.department);
          router.push(userHomePage);
        } else {
          router.push("/lvm"); // Fallback
        }
        router.refresh();
      } else {
        setError(
          result.error === "CredentialsSignin"
            ? "Invalid username or password"
            : "An error occurred. Please try again."
        );
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Please sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="username" className="block mb-2 font-medium text-gray-700">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              className={errors.username ? "border-red-500" : ""}
              {...register("username")}
              disabled={loading}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block mb-2 font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                {...register("password")}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

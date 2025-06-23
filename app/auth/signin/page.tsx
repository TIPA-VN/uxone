// app/auth/signin/page.tsx
import { Suspense } from "react";
import SignInPage from "./SignInPage";

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading sign-in page...</div>}>
      <SignInPage />
    </Suspense>
  );
}

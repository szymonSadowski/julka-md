"use client";

import type React from "react";
import { ConvexClientProvider } from "./convex-provider";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { ClerkProvider, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <AuthLoading>
          <div className="flex justify-center items-center min-h-screen">
            <p className="text-white">Loading...</p>
          </div>
        </AuthLoading>
        <Unauthenticated>
          <div className="flex justify-center items-center min-h-screen">
            <SignInButton>
              <Button className="bg-white text-black">
                Sign In With Google
              </Button>
            </SignInButton>
          </div>
        </Unauthenticated>
        <Authenticated>
          <div className="flex flex-col min-h-screen bg-black">{children}</div>
        </Authenticated>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}

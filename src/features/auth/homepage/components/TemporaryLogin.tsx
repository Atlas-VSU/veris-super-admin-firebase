/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  getIdToken,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/firebase/firebase.config";
import { LoginLoadingOverlay } from "@/features/auth/login/LoginLoadingOverlay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function TemporaryLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Clear errors on Escape
      if (e.key === "Escape") {
        setError(null);
        setEmailError(null);
        setPasswordError(null);
        setSuccessMessage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError(null);
    setError(null);
    setSuccessMessage(null);
  };

  // Form validation function
  const validateForm = (): boolean => {
    let isValid = true;
    // Reset field errors
    setEmailError(null);
    setPasswordError(null);

    // Email validation
    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await getIdToken(userCredential.user);

      // Make the API call to create the session
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }
      // Set success message
      setSuccessMessage("Login successful! Redirecting...");
      router.refresh();
      router.push("/");
    } catch (error: any) {
      console.error("Login failed", error);

      // Handle specific Firebase auth errors
      if (error.code === "auth/wrong-password") {
        setPasswordError("Invalid password. Please try again.");
      } else if (error.code === "auth/user-not-found") {
        setEmailError("No account found with this email.");
      } else if (error.code === "auth/invalid-email") {
        setEmailError("Please enter a valid email address.");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else if (error.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("An error occurred during sign in. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setEmailError("Please enter your email to reset your password.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent. Please check your inbox.");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        setEmailError("No account found with this email.");
      } else if (error.code === "auth/invalid-email") {
        setEmailError("Please enter a valid email address.");
      } else {
        setError("Failed to send password reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    cn(
      "h-11 w-full rounded-md border bg-card pl-10 pr-4 text-sm text-foreground outline-none transition-colors",
      "placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/30 focus:border-primary",
      hasError ? "border-destructive focus:ring-destructive/30 focus:border-destructive" : "border-input",
    );

  return (
    <div className="w-full">
      {/* Show loading overlay when authenticating */}
      {isLoading && <LoginLoadingOverlay />}

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">

        {/* Heading */}
        <div>
          <h2 className="veris-headline text-3xl">Welcome.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your organization credentials to manage
            members, events, and attendance.
          </p>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="veris-eyebrow block"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={inputClass(!!emailError)}
              disabled={isLoading}
              placeholder="you@org.edu"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
              autoComplete="email"
            />
          </div>
          {emailError && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {emailError}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="veris-eyebrow">
              Password
            </label>
            <button
              type="button"
              onClick={handlePasswordReset}
              className="text-xs font-medium text-primary hover:underline"
              tabIndex={isLoading ? -1 : 0}
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              className={cn(inputClass(!!passwordError), "pr-11")}
              disabled={isLoading}
              placeholder="Enter your password"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "password-error" : undefined}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {passwordError && (
            <p
              id="password-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {passwordError}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="animate-fade-in-up">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message Display */}
        {successMessage && (
          <Alert className="animate-fade-in-up border-primary/20 bg-primary/5 text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Remember Me */}
        <label
          htmlFor="remember"
          className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground"
        >
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="sr-only"
            disabled={isLoading}
          />
          <span
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
              rememberMe
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card",
            )}
          >
            {rememberMe && <CheckCircle2 className="size-3" strokeWidth={3} />}
          </span>
          Keep me signed in on this device
        </label>

        {/* Sign In Button */}
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-between rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          <span>{isLoading ? "Signing in…" : "Sign in to dashboard"}</span>
          <ArrowRight className="size-4" />
        </button>
      </form>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPasswordRequest } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing or invalid password reset token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      await resetPasswordRequest({ token, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password. Token may be expired.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <section className="mx-auto max-w-sm px-4 sm:px-6 py-16 text-center space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Invalid Reset Link</h1>
        <p className="text-sm text-muted-foreground">
          No password reset token was found in the URL. Please request a new password reset link.
        </p>
        <Button onClick={() => navigate("/forgot-password")}>
          Request Password Reset
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-sm px-4 sm:px-6 py-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-primary" />
          Reset Password
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter a new secure password for your Tropikit account.
        </p>
      </div>

      {!success ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reset-new-password">New Password</Label>
            <Input
              id="reset-new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
            <Input
              id="reset-confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetting password..." : "Reset Password"}
          </Button>
        </form>
      ) : (
        <div className="space-y-4 bg-card border border-border p-6 rounded-lg text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Password Reset Complete</h2>
          <p className="text-sm text-muted-foreground">
            Your password has been successfully updated. You can now log in using your new credentials.
          </p>
          <Button className="w-full" onClick={() => navigate("/login")}>
            Log In Now
          </Button>
        </div>
      )}
    </section>
  );
}

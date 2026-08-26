import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordRequest } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setResetToken(null);
    setLoading(true);

    try {
      const res = await forgotPasswordRequest({ email });
      setMessage("If an account exists for that email, password reset instructions have been sent.");
      if (res?.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process password reset request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm px-4 sm:px-6 py-16">
      <div className="mb-6">
        <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-primary" />
          Forgot Password
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      {!message ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="forgot-email">Email Address</Label>
            <Input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending link..." : "Send Reset Link"}
          </Button>
        </form>
      ) : (
        <div className="space-y-4 bg-card border border-border p-4 rounded-lg">
          <p className="text-sm text-foreground leading-relaxed">{message}</p>

          {resetToken && (
            <div className="p-3 bg-muted rounded border border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Development / Testing Notice:</p>
              <p className="text-xs font-mono break-all text-foreground">Token: {resetToken}</p>
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={() => navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`)}
              >
                Reset Password Now
              </Button>
            </div>
          )}

          <div className="pt-2">
            <Link to="/login" className="text-sm font-medium text-primary hover:underline">
              Return to Login
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

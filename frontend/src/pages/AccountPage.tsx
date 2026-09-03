// frontend/src/pages/AccountPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  updateProfileRequest,
  updatePreferencesRequest,
  changePasswordRequest,
  deleteAccountRequest,
} from "@/api/authApi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  User,
  Sliders,
  KeyRound,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Mail,
  Lock,
  Globe,
  Bell,
  Trash2,
} from "lucide-react";

export default function AccountPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile Form State
  const [name, setName] = useState(user?.name ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Preferences Form State
  const [defaultTimezone, setDefaultTimezone] = useState(user?.preferences?.defaultTimezone ?? "");
  const [emailNotifications, setEmailNotifications] = useState(user?.preferences?.emailNotifications ?? true);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState<string | null>(null);
  const [prefError, setPrefError] = useState<string | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // Delete Account State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileSaving(true);

    try {
      await updateProfileRequest({ name });
      await refreshUser();
      setProfileSuccess("Your profile has been updated.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePreferencesSubmit(e: FormEvent) {
    e.preventDefault();
    setPrefError(null);
    setPrefSuccess(null);
    setPrefSaving(true);

    try {
      await updatePreferencesRequest({
        defaultTimezone: defaultTimezone.trim() || null,
        emailNotifications,
      });
      await refreshUser();
      setPrefSuccess("Your preferences have been saved.");
    } catch (err) {
      setPrefError(err instanceof Error ? err.message : "Failed to save preferences.");
    } finally {
      setPrefSaving(false);
    }
  }

  async function handleChangePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwError("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters long.");
      return;
    }

    setPwSaving(true);

    try {
      await changePasswordRequest({ currentPassword, newPassword });
      setPwSuccess(
        "Password changed successfully. Your sessions have been logged out. Please log in with your new password."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  }

  async function handleDeleteAccountSubmit(e: FormEvent) {
    e.preventDefault();
    setDeleteError(null);
    setDeleteSaving(true);

    try {
      await deleteAccountRequest({ password: deletePassword });
      await logout();
      navigate("/");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete account. Verify your password."
      );
      setDeleteSaving(false);
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* 1. Hero Hub Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/10 via-card to-background border border-border p-5 md:p-6 shadow-soft">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Account & Security Settings
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Traveler <span className="text-primary">Profile & Preferences</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Manage your personal profile details, notification delivery rules, clinical time zone calculations, and authentication credentials.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>{user?.email ?? "No email linked"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verified Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Profile Details Section */}
      <Card className="rounded-2xl border border-border bg-card shadow-soft">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">Profile Details</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Update how your name appears on itineraries and health documentation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleProfileSubmit} className="space-y-3.5 max-w-xl">
            <div className="space-y-1">
              <Label htmlFor="account-email" className="text-xs font-bold uppercase text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="account-email"
                type="email"
                value={user?.email ?? ""}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed rounded-xl text-xs sm:text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Your email is your primary account identifier and cannot be modified directly.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="account-name" className="text-xs font-bold uppercase text-muted-foreground">
                Full Name
              </Label>
              <Input
                id="account-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="rounded-xl border-border bg-background text-xs sm:text-sm"
              />
            </div>

            {profileError && <p className="text-xs text-destructive font-medium">{profileError}</p>}
            {profileSuccess && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {profileSuccess}
              </p>
            )}

            <Button
              type="submit"
              disabled={profileSaving}
              className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer shadow-xs"
            >
              {profileSaving ? "Saving profile..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. Preferences Section */}
      <Card className="rounded-2xl border border-border bg-card shadow-soft">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">Traveler Preferences</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Set default timezone calculations and alert dispatch channels.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handlePreferencesSubmit} className="space-y-3.5 max-w-xl">
            <div className="space-y-1">
              <Label htmlFor="account-timezone" className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" />
                Default Timezone
              </Label>
              <Input
                id="account-timezone"
                type="text"
                value={defaultTimezone}
                onChange={(e) => setDefaultTimezone(e.target.value)}
                placeholder="e.g. America/New_York or UTC"
                className="rounded-xl border-border bg-background text-xs sm:text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Applied to antimalarial dosing schedules and pre-trip reminders when trip data has no explicit timezone.
              </p>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-muted/20">
              <input
                id="account-notifications"
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <Label htmlFor="account-notifications" className="text-xs text-foreground cursor-pointer font-medium">
                Dispatch travel preparation reminders and clinic notices via email
              </Label>
            </div>

            {prefError && <p className="text-xs text-destructive font-medium">{prefError}</p>}
            {prefSuccess && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {prefSuccess}
              </p>
            )}

            <Button
              type="submit"
              disabled={prefSaving}
              className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer shadow-xs"
            >
              {prefSaving ? "Saving preferences..." : "Save Preferences"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 4. Security & Password Section */}
      <Card className="rounded-2xl border border-border bg-card shadow-soft">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">Change Password</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Update your account password. Changing credentials terminates active browser sessions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleChangePasswordSubmit} className="space-y-3 max-w-xl">
            <div className="space-y-1">
              <Label htmlFor="current-password" className="text-xs font-bold uppercase text-muted-foreground">
                Current Password
              </Label>
              <Input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-xl border-border bg-background text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="new-password" className="text-xs font-bold uppercase text-muted-foreground">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-xl border-border bg-background text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-password" className="text-xs font-bold uppercase text-muted-foreground">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl border-border bg-background text-xs sm:text-sm"
                />
              </div>
            </div>

            {pwError && <p className="text-xs text-destructive font-medium">{pwError}</p>}
            {pwSuccess && (
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 space-y-2">
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {pwSuccess}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="text-xs rounded-lg"
                >
                  Proceed to Login
                </Button>
              </div>
            )}

            {!pwSuccess && (
              <Button
                type="submit"
                disabled={pwSaving}
                className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer shadow-xs"
              >
                {pwSaving ? "Changing password..." : "Change Password"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 5. Danger Zone */}
      <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 shadow-soft">
        <CardHeader className="pb-3 border-b border-destructive/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-destructive">Danger Zone — Delete Account</CardTitle>
              <CardDescription className="text-xs text-destructive/80">
                Permanently purge your account, trips, custom health checklists, and malaria prevention plans.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Account
            </Button>
          ) : (
            <form onSubmit={handleDeleteAccountSubmit} className="space-y-3 max-w-md bg-card p-4 rounded-xl border border-destructive/30 shadow-xs">
              <p className="text-xs text-foreground font-semibold">
                Are you sure? This action cannot be undone. Please enter your password to confirm permanent deletion.
              </p>
              <div className="space-y-1">
                <Label htmlFor="delete-confirm-password" className="text-xs font-bold uppercase text-muted-foreground">
                  Confirm Password
                </Label>
                <Input
                  id="delete-confirm-password"
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="rounded-xl border-border bg-background text-xs sm:text-sm"
                />
              </div>

              {deleteError && <p className="text-xs text-destructive font-medium">{deleteError}</p>}

              <div className="flex items-center gap-2.5 pt-1">
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={deleteSaving}
                  className="rounded-xl px-3.5 py-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {deleteSaving ? "Deleting..." : "Permanently Delete Account"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleteSaving}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                    setDeleteError(null);
                  }}
                  className="rounded-xl px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
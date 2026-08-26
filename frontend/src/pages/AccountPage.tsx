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
import { Shield, User, Sliders, KeyRound, AlertTriangle } from "lucide-react";

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
      setPwSuccess("Password changed successfully. Your sessions have been logged out. Please log in with your new password.");
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
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account. Verify your password.");
      setDeleteSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          My Account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal details, preferences, and security settings.
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            Profile Details
          </CardTitle>
          <CardDescription>Update your personal display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <Label htmlFor="account-email">Email Address</Label>
              <Input
                id="account-email"
                type="email"
                value={user?.email ?? ""}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your email address is your primary account identifier and cannot be changed directly.
              </p>
            </div>

            <div>
              <Label htmlFor="account-name">Full Name</Label>
              <Input
                id="account-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            {profileError && <p className="text-sm text-destructive">{profileError}</p>}
            {profileSuccess && <p className="text-sm text-emerald-600 font-medium">{profileSuccess}</p>}

            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? "Saving profile..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sliders className="h-5 w-5 text-muted-foreground" />
            Preferences
          </CardTitle>
          <CardDescription>Customize your default time zone and notification preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreferencesSubmit} className="space-y-4">
            <div>
              <Label htmlFor="account-timezone">Default Timezone</Label>
              <Input
                id="account-timezone"
                type="text"
                value={defaultTimezone}
                onChange={(e) => setDefaultTimezone(e.target.value)}
                placeholder="e.g. America/New_York or UTC"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used to calculate malaria medication schedules when no trip-specific timezone is provided.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="account-notifications"
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="account-notifications" className="text-sm font-medium cursor-pointer">
                Receive travel preparation and reminder notifications via email
              </Label>
            </div>

            {prefError && <p className="text-sm text-destructive">{prefError}</p>}
            {prefSuccess && <p className="text-sm text-emerald-600 font-medium">{prefSuccess}</p>}

            <Button type="submit" disabled={prefSaving}>
              {prefSaving ? "Saving preferences..." : "Save Preferences"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password. Changing your password will log out active sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            {pwSuccess && (
              <div className="space-y-2">
                <p className="text-sm text-emerald-600 font-medium">{pwSuccess}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => navigate("/login")}>
                  Proceed to Login
                </Button>
              </div>
            )}

            {!pwSuccess && (
              <Button type="submit" disabled={pwSaving}>
                {pwSaving ? "Changing password..." : "Change Password"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Delete Account Section */}
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone — Delete Account
          </CardTitle>
          <CardDescription className="text-destructive/80">
            Permanently delete your account and remove all saved trips, checklist items, and malaria plans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              Delete Account
            </Button>
          ) : (
            <form onSubmit={handleDeleteAccountSubmit} className="space-y-4 max-w-md bg-card p-4 rounded-md border border-destructive/30">
              <p className="text-sm text-foreground font-medium">
                Are you sure? This action cannot be undone. Please enter your password to confirm deletion.
              </p>
              <div>
                <Label htmlFor="delete-confirm-password">Confirm Password</Label>
                <Input
                  id="delete-confirm-password"
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </div>

              {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

              <div className="flex items-center gap-3">
                <Button type="submit" variant="destructive" disabled={deleteSaving}>
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
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

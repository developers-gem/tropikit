import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import AccountPage from "@/pages/AccountPage";
import { useAuth } from "@/contexts/AuthContext";
import * as authApi from "@/api/authApi";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/api/authApi", () => ({
  updateProfileRequest: vi.fn(),
  updatePreferencesRequest: vi.fn(),
  changePasswordRequest: vi.fn(),
  deleteAccountRequest: vi.fn(),
}));

const mockUser = {
  id: "user-1",
  email: "traveler@example.com",
  name: "Jane Traveler",
  preferences: { defaultTimezone: "America/New_York", emailNotifications: true },
};

const mockLogout = vi.fn();
const mockRefreshUser = vi.fn();

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      refreshUser: mockRefreshUser,
    });
  });

  it("renders user email and prefilled profile details", () => {
    renderWithProviders(<AccountPage />);
    expect(screen.getByLabelText(/email address/i)).toHaveValue("traveler@example.com");
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Jane Traveler");
  });

  it("submits profile update and refreshes user context", async () => {
    (authApi.updateProfileRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      email: "traveler@example.com",
      name: "Jane Explorer",
    });
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    const nameInput = screen.getByLabelText(/full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Jane Explorer");
    await user.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => {
      expect(authApi.updateProfileRequest).toHaveBeenCalledWith({ name: "Jane Explorer" });
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(screen.getByText(/your profile has been updated/i)).toBeInTheDocument();
    });
  });

  it("submits preferences update successfully", async () => {
    (authApi.updatePreferencesRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      email: "traveler@example.com",
      name: "Jane Traveler",
    });
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(screen.getByRole("button", { name: /save preferences/i }));

    await waitFor(() => {
      expect(authApi.updatePreferencesRequest).toHaveBeenCalledWith({
        defaultTimezone: "America/New_York",
        emailNotifications: true,
      });
      expect(screen.getByText(/your preferences have been saved/i)).toBeInTheDocument();
    });
  });

  it("shows error when new password and confirm password do not match", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.type(screen.getByLabelText(/current password/i), "old-password");
    await user.type(screen.getByLabelText(/^new password$/i), "new-password-123");
    await user.type(screen.getByLabelText(/confirm new password/i), "different-password");
    await user.click(screen.getByRole("button", { name: /change password/i }));

    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
    expect(authApi.changePasswordRequest).not.toHaveBeenCalled();
  });

  it("shows delete confirmation and calls deleteAccountRequest on password entry", async () => {
    (authApi.deleteAccountRequest as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    mockLogout.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(screen.getByRole("button", { name: /^delete account$/i }));

    const passwordInput = screen.getByLabelText(/confirm password/i);
    await user.type(passwordInput, "my-secret-password");
    await user.click(screen.getByRole("button", { name: /permanently delete account/i }));

    await waitFor(() => {
      expect(authApi.deleteAccountRequest).toHaveBeenCalledWith({ password: "my-secret-password" });
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});

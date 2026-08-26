import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import * as authApi from "@/api/authApi";

vi.mock("@/api/authApi", () => ({
  forgotPasswordRequest: vi.fn(),
  resetPasswordRequest: vi.fn(),
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email input field and submit button", () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("submits email and displays success confirmation message", async () => {
    (authApi.forgotPasswordRequest as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email address/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(authApi.forgotPasswordRequest).toHaveBeenCalledWith({ email: "user@example.com" });
      expect(screen.getByText(/instructions have been sent/i)).toBeInTheDocument();
    });
  });
});

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows invalid token error state when token query param is missing", () => {
    renderWithProviders(<ResetPasswordPage />, { route: "/reset-password" });
    expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /request password reset/i })).toBeInTheDocument();
  });

  it("renders password inputs when valid token query parameter is present", () => {
    renderWithProviders(<ResetPasswordPage />, { route: "/reset-password?token=sample-token-123" });
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it("submits new password successfully when valid token is present", async () => {
    (authApi.resetPasswordRequest as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, { route: "/reset-password?token=valid-token" });

    await user.type(screen.getByLabelText(/^new password$/i), "new-secure-password");
    await user.type(screen.getByLabelText(/confirm new password/i), "new-secure-password");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(authApi.resetPasswordRequest).toHaveBeenCalledWith({
        token: "valid-token",
        newPassword: "new-secure-password",
      });
      expect(screen.getByText(/password reset complete/i)).toBeInTheDocument();
    });
  });
});

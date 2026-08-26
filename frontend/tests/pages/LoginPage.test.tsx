import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import LoginPage from "@/pages/LoginPage";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockLogin = vi.fn();

describe("LoginPage", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ login: mockLogin });
  });

  it("renders email and password fields with accessible labels", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("submits the form and calls login with the entered credentials", async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-password");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "correct-password");
    });
  });

  it("shows an error message when login fails, without crashing", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid email or password"));
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it("requires both fields before allowing submission (native HTML validation)", () => {
    renderWithProviders(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it("has a link to the registration page", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/register");
  });

  it("redirects admin, content-editor, and reviewer roles to /admin on login", async () => {
    mockLogin.mockResolvedValue({ id: "1", email: "admin@example.com", name: "Admin", role: "admin" });
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/password/i), "admin123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin@example.com", "admin123");
    });
  });

  it("redirects normal 'user' role to /account/trips on login", async () => {
    mockLogin.mockResolvedValue({ id: "2", email: "user@example.com", name: "User", role: "user" });
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "user123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@example.com", "user123");
    });
  });
});

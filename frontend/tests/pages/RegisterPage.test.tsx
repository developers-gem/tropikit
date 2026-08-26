import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import RegisterPage from "@/pages/RegisterPage";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));

const mockRegister = vi.fn();

describe("RegisterPage", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ register: mockRegister });
  });

  it("renders name, email, and password fields with accessible labels", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("enforces an 8-character minimum on the password field", () => {
    renderWithProviders(<RegisterPage />);
    const password = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(password).toHaveAttribute("minlength", "8");
  });

  it("submits valid input and calls register with email/password/name", async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/name/i), "New User");
    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/password/i), "a-strong-password");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("new@example.com", "a-strong-password", "New User");
    });
  });

  it("surfaces a conflict error (duplicate email) without crashing", async () => {
    mockRegister.mockRejectedValue(new Error("An account with this email already exists"));
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/email/i), "dupe@example.com");
    await user.type(screen.getByLabelText(/password/i), "a-strong-password");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });
});

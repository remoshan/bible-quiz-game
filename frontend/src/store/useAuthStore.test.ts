import { beforeEach, expect, test, vi } from "vitest";
import { request } from "@/lib/api";
import { recoveryFromHash, useAuthStore } from "@/store/useAuthStore";

vi.mock("@/lib/api", () => ({ request: vi.fn() }));

const mockRequest = vi.mocked(request);

beforeEach(() => {
  mockRequest.mockReset();
  useAuthStore.setState({ recovery: null, busy: false, error: null, notice: null });
});

test("a reset link's hash yields its token, an expired link yields none, anything else is ignored", () => {
  expect(recoveryFromHash("#access_token=abc&expires_in=3600&type=recovery")).toEqual({ token: "abc" });
  expect(
    recoveryFromHash("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid")
  ).toEqual({ token: null });
  expect(recoveryFromHash("#access_token=abc&type=signup")).toBeNull();
  expect(recoveryFromHash("")).toBeNull();
});

test("a new password is sent with the link's token and ends recovery", async () => {
  useAuthStore.setState({ recovery: { token: "abc" } });
  mockRequest.mockResolvedValue({ reset: true });

  expect(await useAuthStore.getState().resetPassword("new-password")).toBe(true);

  expect(mockRequest).toHaveBeenCalledWith("/api/auth/reset", {
    method: "POST",
    body: JSON.stringify({ accessToken: "abc", password: "new-password" }),
  });
  expect(useAuthStore.getState().recovery).toBeNull();
  expect(useAuthStore.getState().notice).toMatch(/Password updated/);
});

test("a rejected reset keeps the screen open with the server's reason", async () => {
  useAuthStore.setState({ recovery: { token: "abc" } });
  mockRequest.mockRejectedValue(new Error("This reset link has expired. Request a new one."));

  expect(await useAuthStore.getState().resetPassword("new-password")).toBe(false);

  expect(useAuthStore.getState().recovery).toEqual({ token: "abc" });
  expect(useAuthStore.getState().error).toMatch(/expired/);
});

const session = {
  accessToken: "tok",
  refreshToken: "ref",
  expiresAt: Date.now() + 3_600_000,
  user: { id: "u1", displayName: "Old Name" },
};

test("a rename is sent with the player's token and updates the stored name", async () => {
  useAuthStore.setState({ session });
  mockRequest.mockResolvedValue({ user: { id: "u1", displayName: "New Name" } });

  expect(await useAuthStore.getState().rename("New Name")).toBe(true);

  expect(mockRequest).toHaveBeenCalledWith("/api/auth/profile", {
    method: "PATCH",
    headers: { Authorization: "Bearer tok" },
    body: JSON.stringify({ displayName: "New Name" }),
  });
  expect(useAuthStore.getState().session?.user.displayName).toBe("New Name");
});

test("a refused rename keeps the old name and shows why", async () => {
  useAuthStore.setState({ session });
  mockRequest.mockRejectedValue(new Error("That display name is taken. Try another."));

  expect(await useAuthStore.getState().rename("Taken")).toBe(false);

  expect(useAuthStore.getState().session?.user.displayName).toBe("Old Name");
  expect(useAuthStore.getState().error).toMatch(/taken/);
});

test("an expired link never calls the API", async () => {
  useAuthStore.setState({ recovery: { token: null } });

  expect(await useAuthStore.getState().resetPassword("new-password")).toBe(false);
  expect(mockRequest).not.toHaveBeenCalled();
});

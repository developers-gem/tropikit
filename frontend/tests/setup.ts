import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Without this, DOM from one test persists into the next (React Testing Library doesn't
// auto-cleanup outside a Jest-specific environment), which was causing "multiple elements
// found" failures in any test file with more than one test — a real gap in the test setup,
// not a bug in the components under test.
afterEach(() => {
  cleanup();
});

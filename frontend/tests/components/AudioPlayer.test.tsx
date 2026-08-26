import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AudioPlayer } from "@/components/AudioPlayer";

/**
 * jsdom doesn't implement real audio decoding — an <audio> element never fires
 * `loadedmetadata` on its own here, which is what the component waits for before leaving its
 * "Loading audio…" state. Dispatching the event manually is the standard, honest way to test
 * a media component under jsdom: it simulates exactly the browser event the component's own
 * code listens for, without needing a real audio file or a real browser.
 */
function finishLoading(container: HTMLElement) {
  const audio = container.querySelector("audio")!;
  Object.defineProperty(audio, "duration", { value: 180, configurable: true });
  fireEvent.loadedMetadata(audio);
}

describe("AudioPlayer", () => {
  it("shows the 'unavailable' state when src is null, per spec requirement", () => {
    render(<AudioPlayer src={null} title="A story" />);
    expect(screen.getByText(/audio isn't available/i)).toBeInTheDocument();
  });

  it("does not render play/pause controls at all when there's no audio source", () => {
    render(<AudioPlayer src={null} title="A story" />);
    expect(screen.queryByRole("button", { name: /play/i })).not.toBeInTheDocument();
  });

  it("shows a loading state before metadata is available", () => {
    render(<AudioPlayer src="https://example.com/audio.mp3" title="A story" />);
    expect(screen.getByText(/loading audio/i)).toBeInTheDocument();
  });

  it("renders accessible labels for the seek and volume sliders once loaded", () => {
    const { container } = render(<AudioPlayer src="https://example.com/audio.mp3" title="A story" />);
    finishLoading(container);
    expect(screen.getByLabelText("Seek")).toBeInTheDocument();
    expect(screen.getByLabelText("Volume")).toBeInTheDocument();
  });

  it("does not render previous/next controls when no playlist context is given", () => {
    const { container } = render(<AudioPlayer src="https://example.com/audio.mp3" title="A story" />);
    finishLoading(container);
    expect(screen.queryByLabelText(/previous story/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/next story/i)).not.toBeInTheDocument();
  });

  it("renders previous/next controls when playlist callbacks are provided, respecting hasPrevious/hasNext", () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const { container } = render(
      <AudioPlayer
        src="https://example.com/audio.mp3"
        title="A story"
        onPrevious={onPrevious}
        onNext={onNext}
        hasPrevious={false}
        hasNext={true}
      />,
    );
    finishLoading(container);
    expect(screen.getByLabelText(/previous story/i)).toBeDisabled();
    expect(screen.getByLabelText(/next story/i)).not.toBeDisabled();
  });

  it("clicking Next calls the onNext callback", async () => {
    const onNext = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <AudioPlayer src="https://example.com/audio.mp3" title="A story" onNext={onNext} hasNext={true} />,
    );
    finishLoading(container);
    await user.click(screen.getByLabelText(/next story/i));
    expect(onNext).toHaveBeenCalled();
  });

  it("exposes all 5 required playback speed options", () => {
    const { container } = render(<AudioPlayer src="https://example.com/audio.mp3" title="A story" />);
    finishLoading(container);
    ["0.75x", "1x", "1.25x", "1.5x", "2x"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("the underlying <audio> element never has autoPlay enabled", () => {
    const { container } = render(<AudioPlayer src="https://example.com/audio.mp3" title="A story" />);
    const audioEl = container.querySelector("audio");
    expect(audioEl).not.toHaveAttribute("autoplay");
  });
});


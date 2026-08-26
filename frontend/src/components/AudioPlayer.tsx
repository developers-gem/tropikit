import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, SkipBack, SkipForward } from "lucide-react";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/**
 * IMPORTANT for callers: pass a `key` prop that changes with the track (e.g. `key={story._id}`)
 * whenever this player might switch to a different audio source in place — via Previous/Next,
 * for instance. React will then remount the component on track change and all transport state
 * (playing/current/duration/error) naturally resets to its initial values, with no need for an
 * effect that calls setState on every src change (which both adds an unnecessary render pass
 * and is exactly the anti-pattern React's own hooks lint rule flags).
 */

function formatTime(sec: number): string {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function AudioPlayer({
  src,
  title,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: {
  src: string | null;
  title: string;
  /** Playlist-style navigation between sibling stories (e.g. same destination or category).
   *  Omit these props entirely when there's no playlist context — the buttons simply won't
   *  render, rather than rendering disabled. */
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}) {  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrent(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
    };
    const onEnded = () => setPlaying(false);
    const onError = () => {
      setError("This audio couldn't be loaded. Use the transcript below instead.");
      setLoading(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [src]);

  const showPlaylistControls = onPrevious !== undefined || onNext !== undefined;

  if (!src) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Audio isn't available for this story yet — read the transcript below.
      </div>
    );
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => setError("Playback was blocked. Tap play again."));
    }
    setPlaying(!playing);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const value = Number(e.target.value);
    audio.currentTime = value;
    setCurrent(value);
  }

  function changeSpeed(s: number) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  function replay() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrent(0);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/*
        eslint-disable-next-line jsx-a11y/media-has-caption --
        This is prerecorded audio-only narration, not video. WCAG 1.2.1 permits a full text
        transcript as the equivalent alternative for audio-only content instead of a
        synchronized caption track — StoryDetailPage.tsx provides exactly that via the
        "Read instead" toggle, using the same `transcript` field. A <track> caption file
        would be redundant with, and harder to keep in sync than, that existing transcript.
      */}
      <audio ref={audioRef} src={src} preload="metadata" autoPlay={false} />
      <span className="sr-only">
        A full text transcript of this narration is available via the "Read instead" option
        on this page.
      </span>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading audio…</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3">
            {showPlaylistControls && (
              <button
                onClick={onPrevious}
                disabled={!hasPrevious}
                aria-label="Previous story"
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
              >
                <SkipBack className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            {showPlaylistControls && (
              <button
                onClick={onNext}
                disabled={!hasNext}
                aria-label="Next story"
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            )}
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground truncate">{title}</div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={current}
                onChange={seek}
                aria-label="Seek"
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(current)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <button onClick={replay} aria-label="Replay" className="text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
                {muted ? (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={changeVolume}
                aria-label="Volume"
                className="w-20 accent-primary"
              />
            </div>
            <div className="flex items-center gap-1 text-xs">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => changeSpeed(s)}
                  className={`px-2 py-1 rounded ${
                    speed === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

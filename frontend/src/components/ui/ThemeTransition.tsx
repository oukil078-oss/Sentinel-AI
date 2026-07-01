import { useEffect, useRef } from "react";

interface Props {
  target: "dark" | "light";
  onMidpoint: () => void;
  onComplete: () => void;
}

/**
 * Full-screen circular-reveal transition overlay.
 *
 * Dark → Light: a white "white-hole" circle expands from center
 * Light → Dark: a dark "black-hole" circle expands from center
 *
 * Uses the Web Animations API for buttery-smooth clip-path animation.
 */
export function ThemeTransition({ target, onMidpoint, onComplete }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const spark = sparkRef.current;
    if (!overlay) return;

    /* ---------- center spark / flash ---------- */
    if (spark) {
      spark.animate(
        [
          { transform: "translate(-50%,-50%) scale(0)", opacity: "1" },
          { transform: "translate(-50%,-50%) scale(12)", opacity: "0.5" },
          { transform: "translate(-50%,-50%) scale(25)", opacity: "0" },
        ],
        { duration: 700, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
      );
    }

    /* ---------- main circle expansion ---------- */
    const expand = overlay.animate(
      [
        { clipPath: "circle(0% at 50% 50%)" },
        { clipPath: "circle(150% at 50% 50%)" },
      ],
      {
        duration: 750,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)", // expo-out
        fill: "forwards",
      }
    );

    // Swap the actual theme class when the circle covers ~70 % of the viewport
    const midTimer = setTimeout(onMidpoint, 380);

    // After the circle covers everything, fade it away and clean up
    expand.onfinish = () => {
      const fade = overlay.animate(
        [{ opacity: "1" }, { opacity: "0" }],
        { duration: 350, easing: "ease-out", fill: "forwards" }
      );
      fade.onfinish = onComplete;
    };

    return () => {
      clearTimeout(midTimer);
      expand.cancel();
    };
  }, [onMidpoint, onComplete]);

  const isDark = target === "dark";
  const bg = isDark ? "#0B0B0D" : "#F5F5F7";
  const sparkColor = isDark
    ? "radial-gradient(circle, rgba(198,242,78,0.55) 0%, transparent 70%)"
    : "radial-gradient(circle, rgba(198,242,78,0.7) 0%, transparent 70%)";

  return (
    <>
      {/* Spark / energy flash at the very center */}
      <div
        ref={sparkRef}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: sparkColor,
          zIndex: 100000,
          pointerEvents: "none",
          willChange: "transform, opacity",
        }}
      />

      {/* Expanding circle overlay */}
      <div
        ref={overlayRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          pointerEvents: "none",
          backgroundColor: bg,
          clipPath: "circle(0% at 50% 50%)",
          willChange: "clip-path, opacity",
        }}
      >
        {/* Subtle radial glow inside the expanding disc */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? "radial-gradient(circle at 50% 50%, transparent 30%, rgba(198,242,78,0.04) 65%, transparent 100%)"
              : "radial-gradient(circle at 50% 50%, transparent 30%, rgba(198,242,78,0.06) 65%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </>
  );
}

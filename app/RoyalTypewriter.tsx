"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

type RoyalTypewriterProps = {
  advancing: boolean;
  carriagePosition: number;
  lines: string[];
  returning: boolean;
  strikeId: number;
};

type TypewriterStyle = CSSProperties & {
  "--carriage-x": string;
  "--paper-y": string;
};

const CANVAS_WIDTH = 1536;
const IMPACT_X = 773;
const PAPER_LEFT = CANVAS_WIDTH * 0.33;
const PAPER_WIDTH = CANVAS_WIDTH * 0.4;
const PRINTABLE_REFERENCE_WIDTH = CANVAS_WIDTH * 0.34;
const ORIGINAL_MARGIN = PRINTABLE_REFERENCE_WIDTH * 0.14;
const PRINTABLE_WIDTH = PRINTABLE_REFERENCE_WIDTH - ORIGINAL_MARGIN * 2;
const PAPER_MARGIN = (PAPER_WIDTH - PRINTABLE_WIDTH) / 2;
const GLYPH_PITCH = 8.8;
const CARRIAGE_HOME = IMPACT_X - PAPER_LEFT - PAPER_MARGIN - GLYPH_PITCH;
const MAX_COLUMNS = 42;
const ACTIVE_LINE_TOP = 162;
const LINE_FEED = 28;

type RasterLayerProps = {
  className: string;
  priority?: boolean;
  src: string;
};

function RasterLayer({ className, priority = false, src }: RasterLayerProps) {
  return (
    <div className={`typewriter-layer ${className}`} aria-hidden="true">
      <Image
        alt=""
        draggable={false}
        fill
        priority={priority}
        sizes="(max-width: 700px) 112vw, (max-width: 1512px) 78vw, 1180px"
        src={src}
        unoptimized
      />
    </div>
  );
}

export default function RoyalTypewriter({
  advancing,
  carriagePosition,
  lines,
  returning,
  strikeId,
}: RoyalTypewriterProps) {
  const boundedColumn = Math.min(Math.max(carriagePosition, 0), MAX_COLUMNS);
  const carriageX = CARRIAGE_HOME - boundedColumn * GLYPH_PITCH;
  const activeLineIndex = Math.max(lines.length - 1, 0);
  const typewriterStyle: TypewriterStyle = {
    "--carriage-x": `${(carriageX / CANVAS_WIDTH) * 100}%`,
    "--paper-y": `${((-activeLineIndex * LINE_FEED) / CANVAS_WIDTH) * 100}cqi`,
  };

  return (
    <div className="royal-typewriter" aria-hidden="true">
      <div
        className={`typewriter-raster-stage${returning ? " is-returning" : ""}${advancing ? " is-advancing" : ""}`}
        style={typewriterStyle}
      >
        <RasterLayer
          className="typewriter-carriage-bed"
          priority
          src="/typewriter/typewriter-carriage-bed.png"
        />

        <RasterLayer
          className="typewriter-carriage-rear typewriter-moving"
          priority
          src="/typewriter/typewriter-carriage-rear.png"
        />

        <div className="typewriter-paper-wrap typewriter-moving">
          <div className="typewriter-paper">
            <div className="typewriter-paper-copy">
              {lines.map((line, lineIndex) => {
                const lineTop = ACTIVE_LINE_TOP + lineIndex * LINE_FEED;

                return (
                  <pre
                    className={`typewriter-paper-line${lineIndex === activeLineIndex ? " active-line" : " committed-line"}`}
                    key={lineIndex}
                    style={{
                      top: `${(lineTop / CANVAS_WIDTH) * 100}cqi`,
                    }}
                  >
                    {line}
                  </pre>
                );
              })}
            </div>
          </div>
        </div>

        <RasterLayer
          className="typewriter-carriage-foreground typewriter-moving"
          priority
          src="/typewriter/typewriter-carriage-foreground.png"
        />

        <RasterLayer
          className="typewriter-stationary"
          priority
          src="/typewriter/typewriter-stationary.png"
        />

        <RasterLayer
          className={`typewriter-strike${strikeId > 0 ? " is-striking" : ""}`}
          key={strikeId}
          src="/typewriter/typewriter-strike-up.png"
        />
      </div>
    </div>
  );
}

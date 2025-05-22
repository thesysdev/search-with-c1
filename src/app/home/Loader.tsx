"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import React, { useMemo, type JSX } from "react";

export type ShimmerProps = {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
};

export function Shimmer({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
}: ShimmerProps) {
  const MotionComponent = motion.create(
    Component as keyof JSX.IntrinsicElements
  );

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={clsx(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text",
        "text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        "dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        className
      )}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
      }}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
        } as React.CSSProperties
      }
    >
      {children}
    </MotionComponent>
  );
}

export const TextLoader = ({
  show,
  text,
  className,
}: {
  show: boolean;
  text: string;
  className?: string;
}) => {
  if (!show) return null;

  return (
    <Shimmer
      duration={4}
      spread={5}
      className={clsx(
        "[--base-color:#5b5b5b] [--base-gradient-color:#dcdcdc]",
        className
      )}
    >
      {text}
    </Shimmer>
  );
};

export const SkeletonLoader = ({
  show,
  lines = 3,
  className,
}: {
  show: boolean;
  lines?: number;
  className?: string;
}) => {
  if (!show) return null;

  // Create dummy texts of varying length to simulate paragraph lines
  const generatePlaceholderTexts = () => {
    const texts = [];
    for (let i = 0; i < lines; i++) {
      // Vary the length of each line for a more natural paragraph look
      const isLastLine = i === lines - 1;
      const charCount = isLastLine
        ? Math.floor(Math.random() * 30) + 20 // 20-50 chars for last line
        : Math.floor(Math.random() * 40) + 60; // 60-100 chars for other lines
      
      const placeholder = "█".repeat(charCount);
      texts.push(placeholder);
    }
    return texts;
  };

  const placeholderTexts = generatePlaceholderTexts();

  return (
    <div className={clsx("flex flex-col space-y-2", className)}>
      {placeholderTexts.map((text, index) => (
        <Shimmer
          key={index}
          duration={4}
          spread={5}
          className={clsx(
            "[--base-color:#5b5b5b] [--base-gradient-color:#dcdcdc]",
            "block"
          )}
        >
          {text}
        </Shimmer>
      ))}
    </div>
  );
};

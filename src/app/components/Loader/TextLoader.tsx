"use client";

import clsx from "clsx";
import { Shimmer } from "../Shimmer/Shimmer";

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
        className,
      )}
    >
      {text}
    </Shimmer>
  );
};

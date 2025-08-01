import clsx from "clsx";
import Image from "next/image";
import React from "react";

import { useSharedUIState } from "@/app/context/UIStateContext";
import { useIsMobile } from "@/app/hooks/useIsMobile";

import { SearchInput } from "../../components/SearchInput";

import styles from "./LandingView.module.scss";

export const LandingView = () => {
  const isMobile = useIsMobile();
  const { state, handleSearch } = useSharedUIState();

  return (
    <>
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
        <Image
          src="/background.svg"
          alt="background"
          fill
          priority
          className="object-cover"
        />
      </div>
      <div
        className={clsx(
          "flex flex-col items-center justify-center -mt-[60px] relative z-10",
          isMobile && "mx-5",
        )}
      >
        <div className="flex mb-xl">
          <Image
            src="/page-title.svg"
            alt="Thesys Logo"
            width={isMobile ? 200 : 300}
            height={isMobile ? 100 : 100}
            priority
          />
        </div>
        <SearchInput
          value={state.query}
          onSearch={handleSearch}
          className={styles.centeredSearchContainer}
        />
        <p className={styles.poweredByContainer}>
          <Image
            src="/page-subtitle.svg"
            alt="Thesys Logo"
            width={isMobile ? 250 : 300}
            height={23}
            priority
          />
        </p>
      </div>
    </>
  );
};

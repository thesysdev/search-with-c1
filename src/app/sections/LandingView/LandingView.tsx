import React from "react";
import Image from "next/image";
import clsx from "clsx";
import { SearchInput } from "../../components/SearchInput";
import styles from "./LandingView.module.scss";
import { useSearchHandler } from "@/app/hooks/useSearchHandler";

interface LandingViewProps {
  isMobile: boolean;
  searchText: string;
}

export const LandingView = ({ isMobile, searchText }: LandingViewProps) => {
  const { handleSearch } = useSearchHandler();
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
          value={searchText}
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

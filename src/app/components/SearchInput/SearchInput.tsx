import { IconButton } from "@crayonai/react-ui";
import clsx from "clsx";
import { SearchIcon, StopCircleIcon } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";

import { SearchProvider } from "@/app/api/types/searchProvider";
import { useSharedUIState } from "@/app/context/UIStateContext";

import { Select } from "../Select";

import styles from "./SearchInput.module.scss";

interface SearchInputProps {
  value: string;
  disabled?: boolean;
  onSearch: (value: string) => void;
  className?: string;
}

export const SearchInput = ({
  value,
  disabled,
  onSearch,
  className,
}: SearchInputProps) => {
  const { state, actions } = useSharedUIState();
  const [searchText, setSearchText] = useState(value);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setSearchText(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchText.length > 0) {
      setIsSearching(true);

      onSearch(searchText);

      setTimeout(() => {
        setIsSearching(false);
      }, 1000);
    }
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-xs",
        styles.searchContainer,
        {
          [styles.searchGlow]: isSearching,
        },
        className,
      )}
    >
      <SearchIcon className={"mr-2 text-secondary"} size={18} />
      <input
        disabled={disabled}
        value={searchText}
        placeholder="Ask anything..."
        onChange={({ target: { value } }) => {
          setSearchText(value);
        }}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      {!state.isLoading && (
        <Select
          label="Search Providers"
          options={[
            {
              label: "Gemini",
              value: SearchProvider.GEMINI,
              icon: (
                <Image src="/gemini.svg" width={10} height={10} alt="Gemini" />
              ),
            },
            {
              label: "Exa",
              value: SearchProvider.EXA,
              icon: <Image src="/exa.svg" width={10} height={10} alt="Exa" />,
            },
          ]}
          placeholder="Select search provider"
          value={state.searchProvider}
          onChange={(value) => {
            actions.setSearchProvider(value as SearchProvider);
          }}
        />
      )}
      {state.isLoading && (
        <IconButton
          icon={<StopCircleIcon />}
          variant="tertiary"
          className="ml-1"
          onClick={() => {
            actions.abortController?.abort();
          }}
        />
      )}
    </div>
  );
};

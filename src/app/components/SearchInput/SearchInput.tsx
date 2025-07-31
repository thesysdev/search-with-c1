import React, { useEffect, useState } from "react";
import styles from "./SearchInput.module.scss";
import { SearchIcon } from "lucide-react";
import clsx from "clsx";

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
        "flex items-center",
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
    </div>
  );
};

import React from "react";
import styles from "./SearchInput.module.scss";
import { SearchIcon } from "lucide-react";
import clsx from "clsx";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  className?: string;
}

export const SearchInput = ({
  value,
  onChange,
  onKeyDown,
  className,
}: SearchInputProps) => (
  <div className={clsx("flex items-center", styles.searchInputContainer, className)}>
    <SearchIcon className={'mr-2 text-secondary'} size={18} />
    <input
      value={value}
      placeholder="Ask anything..."
      onChange={({ target: { value } }) => onChange(value)}
      onKeyDown={onKeyDown}
      autoFocus
    />
  </div>
); 
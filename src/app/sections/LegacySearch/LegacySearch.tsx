"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

import { googleWebSearch } from "@/app/api/services/googleWebSearch";
import { GoogleCustomSearchResponseItem } from "@/app/api/types/search";

import SearchResults from "./SearchResults";

interface SearchPageProps {
  query: string;
}

export default function LegacySearch({ query }: SearchPageProps) {
  const [results, setResults] = useState<GoogleCustomSearchResponseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setSearchedQuery(query);

    try {
      const response = await googleWebSearch({ query });

      setResults(response.items ?? []);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (query !== "" && query !== searchedQuery && !isLoading) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, handleSearch, isLoading]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="text-sm text-secondary p-4 pb-3 flex flex-row items-center gap-2">
        <Image
          src="/powered-by-google.svg"
          alt="Google"
          width={106}
          height={14}
        />
      </div>
      <SearchResults
        results={results}
        isLoading={isLoading}
        query={searchedQuery}
      />
    </div>
  );
}

import React from "react";
import styles from "./SearchResults.module.scss";
import { TextLoader } from "../../components/Loader/TextLoader";
import { GoogleCustomSearchResponseItem } from "@/app/api/types/search";

interface SearchResultsProps {
  results: GoogleCustomSearchResponseItem[];
  isLoading?: boolean;
  query?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading = false,
  query = "",
}) => {
  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <TextLoader show={true} text="Loading..." />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={styles.noResults}>
        <p>
          {query
            ? `No results found for "${query}"`
            : "Enter a search query to see results"}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.resultsContainer}>
      {results.map((result, index) => (
        <div key={result.cacheId || index} className={styles.resultItem}>
          <div className={styles.resultHeader}>
            <div className={styles.resultMeta}>
              <div className={styles.breadcrumb}>
                <a
                  href={result.link}
                  className={styles.resultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {result.displayLink}
                </a>
              </div>

              <div className={styles.titleWrapper}>
                <a
                  href={result.link}
                  className={styles.resultTitle}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {result.title}
                </a>
              </div>
            </div>
          </div>

          <div className={styles.resultSnippet}>
            <div>{result.snippet}</div>
          </div>
          <div className="border-t border-default my-2" />
        </div>
      ))}
    </div>
  );
};

export default SearchResults;

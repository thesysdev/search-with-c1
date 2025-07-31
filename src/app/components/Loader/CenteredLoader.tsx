"use client";

import React from "react";
import styles from "./Loader.module.scss";

export const CenteredLoader = () => {
  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loaderText}>
          Brewing up some brilliant search results for you...
        </p>
      </div>
    </div>
  );
};

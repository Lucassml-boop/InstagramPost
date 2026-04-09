"use client";

import { useEffect, useState } from "react";

export function usePortalReady() {
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  return portalReady;
}

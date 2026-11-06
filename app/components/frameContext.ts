"use client";

import { createContext } from "react";

/** True inside <AppFrame>, which already renders the header. */
export const InFrameContext = createContext(false);

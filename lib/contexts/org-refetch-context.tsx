"use client";

import { createContext, useContext } from "react";

interface OrgRefetchContextType {
    refetchOrgData: () => Promise<void>;
}

const OrgRefetchContext = createContext<OrgRefetchContextType | null>(null);

export const useOrgRefetch = () => {
    const context = useContext(OrgRefetchContext);
    if (!context) {
        throw new Error("useOrgRefetch must be used within OrgRefetchProvider");
    }
    return context;
};

export const OrgRefetchProvider = OrgRefetchContext.Provider;

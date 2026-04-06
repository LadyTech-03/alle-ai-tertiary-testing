import { useState, useEffect } from "react";
import { Search, Folder, X } from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useOrgMemberStore } from "@/stores/edu-store";
import { Button } from "../ui/button";

interface SearchInputProps {
  onDebouncedSearch: (query: string, searchInCurrentFolder: boolean,isTrashFolder?: boolean) => void;
  debounceMs?: number;
  disabled?: boolean;
}

export function OrgSearchInput({
  onDebouncedSearch,
  debounceMs = 400,
  disabled = false,
}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [showFolderBadge, setShowFolderBadge] = useState(false);
  const [showFolderName, setShowFolderName] = useState(false);
  const { breadcrumbPath } = useOrgMemberStore();
  const isTrashFolder =
    breadcrumbPath.length > 0 &&
    breadcrumbPath[breadcrumbPath.length - 1].seat_type === "system";
  
  const lastItem =
    breadcrumbPath.length > 0
      ? breadcrumbPath[breadcrumbPath.length - 1]
      : null;

  // Show badge whenever breadcrumbPath has items and changes
  // useEffect(() => {
  //   if (lastItem) {
  //     setShowFolderBadge(true);
  //     setShowFolderName(false);
  //   } else {
  //     setShowFolderBadge(false);
  //   }
  // }, [lastItem?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onDebouncedSearch(query, showFolderBadge,isTrashFolder);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onDebouncedSearch]);

  const handleCloseBadge = () => {
    setShowFolderBadge(false);
  };

  const handleFolderClick = () => {
    setShowFolderName(!showFolderName);
  };

  const getPlaceholder = () => {
    // if (!lastItem || !showFolderBadge || !isTrashFolder) {
    //   return "Search organization...";
    // }
    if (isTrashFolder) {
      return "Search Deleted Accounts...";
    }
    return "Search organization...";
  };

  // Calculate left padding based on content
  const getInputLeftPadding = () => {
    if (showFolderBadge && lastItem) {
      if (showFolderName) {
        return "pl-44";
      }
      return "pl-28";
    }
    return "pl-10";
  };

  return (
    <div className="flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />

        {showFolderBadge && lastItem && (
          <div className="absolute left-10 top-1/2 transform -translate-y-1/2 z-20">
            <Badge
              variant="secondary"
              className="rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
            >
              <div className="flex items-center gap-1">
                <Button
                  onClick={handleFolderClick}
                  className="flex items-center gap-1.5 hover:bg-transparent p-0 h-5"
                  variant="ghost"
                  size="sm"
                >
                  <Folder className="h-3.5 w-3.5" />
                  {showFolderName && (
                    <span className="text-sm font-medium max-w-20 truncate">
                      {lastItem.name}
                    </span>
                  )}
                </Button>
                <div className="w-px h-3 bg-gray-300 mx-1"></div>
                <Button
                  onClick={handleCloseBadge}
                  className="hover:bg-transparent p-0 h-5 w-5"
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Badge>
          </div>
        )}

        {/* Search Input */}
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={getPlaceholder()}
          className={`w-full pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all ${getInputLeftPadding()}`}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

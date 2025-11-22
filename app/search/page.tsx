"use client";

import React, { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThreadSidebar } from "@/components/thread-sidebar";
import { TabNavigation } from "@/components/tab-navigation";
import { Search, FileText, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchEntry, SearchResult } from "@convex-dev/rag";
import { Value } from "convex/values";

type searchResults = {
  results: SearchResult[];
  text: string;
  entries: SearchEntry<Record<string, Value>, Record<string, Value>>[];
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<searchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchDocuments = useAction(api.rag.ragSearchDocuments);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const searchResults = await searchDocuments({ query: query.trim() });
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults({ results: [], text: "", entries: [] });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-screen">
      <ThreadSidebar />

      <main className="flex-1 flex flex-col">
        <TabNavigation />

        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto py-10 px-6 text-white">
            <h1 className="text-3xl font-semibold mb-4">Search Documents</h1>
            <p className="text-sm text-neutral-300 mb-8">
              Search through your uploaded medical documents using semantic
              search.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your documents..."
                  disabled={isSearching}
                  className="flex-1 bg-black/40 border-neutral-700 text-white placeholder:text-neutral-500"
                  autoComplete="off"
                  enterKeyHint="search"
                  inputMode="search"
                  autoCapitalize="sentences"
                  autoCorrect="on"
                  spellCheck="true"
                />
                <Button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  className="bg-white text-black hover:bg-neutral-200"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>

            {/* Search Results */}
            {results && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {results.results.length > 0
                      ? `Found ${results.results.length} result${results.results.length !== 1 ? "s" : ""}`
                      : "No results found"}
                  </h2>
                </div>

                {results.entries.length > 0 ? (
                  <div className="space-y-4">
                    {results.entries.map((entry, index: number) => (
                      <div
                        key={entry.entryId || index}
                        className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 hover:bg-neutral-800/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-neutral-400 shrink-0 mt-1" />
                          <div className="flex-1">
                            <h3 className="font-medium text-white mb-3">
                              {entry.title}
                            </h3>
                            <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                              {entry.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-neutral-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No matching documents found.</p>
                    <p className="text-sm mt-2">
                      Try a different search query or upload more documents.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!results && (
              <div className="text-center py-12 text-neutral-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter a search query to find relevant information</p>
                <p className="text-sm mt-2">
                  in your uploaded medical documents.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Plus, FileText, Menu, X } from "lucide-react";

interface ThreadSidebarProps {
  currentThreadId?: string;
}

export function ThreadSidebar({ currentThreadId }: ThreadSidebarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const threads = useQuery(api.chat.listUserThreads, {
    paginationOpts: { cursor: null, numItems: 50 },
  });
  const deleteThread = useMutation(api.chat.deleteThread);
  const createThread = useAction(api.chat.createThread);

  const closeSidebar = () => setIsOpen(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm("Are you sure you want to delete this thread?")) {
      await deleteThread({ threadId });
      if (currentThreadId === threadId) {
        router.push("/");
      }
    }
  };

  const handleCreateThread = async () => {
    const newThreadId = await createThread({});
    router.push(`/?thread=${newThreadId}`);
    closeSidebar();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-2 z-50 md:hidden bg-neutral-900/90 backdrop-blur-sm hover:bg-neutral-800"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
        onClick={toggleSidebar}
      >
        <Menu className="w-5 h-5 text-white" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative top-0 left-0 w-64 border-r border-neutral-800 bg-neutral-900 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="p-2 mt-1 border-b border-neutral-800 space-y-1 shrink-0 flex gap-1 flex-col">
          <Link href="/files">
            <Button
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <FileText className="w-4 h-4 mr-2" />
              Manage Files
            </Button>
          </Link>
          <Button
            onClick={handleCreateThread}
            className="w-full justify-start"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Thread
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          <div className="space-y-1">
            {threads?.page.map((thread) => {
              const isActive = thread._id === currentThreadId;
              const title = thread.title || "Untitled Thread";

              return (
                <Link
                  key={thread._id}
                  href={`/?thread=${thread._id}`}
                  onClick={closeSidebar}
                  className={`
                  block p-3 rounded-lg text-sm transition-colors
                  hover:bg-neutral-800/50 group relative
                  ${isActive ? "bg-neutral-800 text-white" : "text-neutral-300"}
                `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 truncate">{title}</span>
                    <button
                      onClick={(e) => handleDeleteThread(thread._id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400"
                      aria-label="Delete thread"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {thread.summary && (
                    <p className="text-xs text-neutral-500 truncate mt-1">
                      {thread.summary}
                    </p>
                  )}
                </Link>
              );
            })}

            {threads?.page.length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-8">
                No threads yet
              </p>
            )}
          </div>
        </div>

        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 md:hidden text-white"
          onClick={closeSidebar}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </>
  );
}

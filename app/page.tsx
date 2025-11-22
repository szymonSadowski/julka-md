"use client";

import React from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ThreadView } from "@/components/thread-view";
import { ThreadSidebar } from "@/components/thread-sidebar";
import { TabNavigation } from "@/components/tab-navigation";
import { useSearchParams, useRouter } from "next/navigation";

export default function ChatPage() {
  const createThread = useAction(api.chat.createThread);
  const searchParams = useSearchParams();
  const router = useRouter();
  const threadId = searchParams.get("thread");

  const handleCreateThread = async () => {
    const newThreadId = await createThread();
    router.push(`/?thread=${newThreadId}`);
  };

  return (
    <div className="flex h-screen">
      <ThreadSidebar currentThreadId={threadId || undefined} />

      <main className="flex-1 flex flex-col">
        <TabNavigation />
        {threadId ? (
          <ThreadView threadId={threadId} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto py-10 px-6 text-white">
              <h1 className="text-3xl font-semibold mb-4">Chat</h1>
              <p className="text-sm text-neutral-300 mb-8">
                AI assistant with access to your uploaded medical documents.
                Create a thread to start chatting.
              </p>
              <Button onClick={handleCreateThread}>Create Thread</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { MessageList } from "./message-list";

export const ThreadView = ({ threadId }: { threadId: string }) => {
  const sendMessageToAgent = useMutation(api.chat.sendMessageToAgent);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessageToAgent({ threadId, prompt: message });
      setMessage("");
      // Scroll to bottom after sending
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto px-6 pt-4 max-h-[calc(100dvh-130px)]"
      >
        <div className="max-w-4xl mx-auto">
          <MessageList threadId={threadId} />
        </div>
      </div>

      <div className="border-t border-neutral-800 bg-neutral-900 backdrop-blur-sm h-22 z-10 flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 p-4 max-w-4xl items-center w-full mx-auto"
        >
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
            className="flex-1 bg-black/40 border-primary text-white placeholder:text-neutral-500"
            autoComplete="off"
            enterKeyHint="send"
            inputMode="text"
            autoCapitalize="sentences"
            autoCorrect="on"
            spellCheck="true"
          />
          <Button
            type="submit"
            disabled={isSending}
            className="bg-secondary text-black hover:bg-neutral-200"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

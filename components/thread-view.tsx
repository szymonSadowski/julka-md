"use client";

import { api } from "@/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";
import { MessageList } from "./message-list";

export const ThreadView = ({ threadId }: { threadId: string }) => {
  const sendMessageToAgent = useMutation(api.chat.sendMessageToAgent);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessageToAgent({ threadId, prompt: message });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
        <div className="max-w-4xl mx-auto">
          <MessageList threadId={threadId} />
        </div>
      </div>

      <div className="border-t border-neutral-800 bg-neutral-900/95 backdrop-blur-sm shrink-0">
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 p-4 max-w-4xl mx-auto"
        >
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
            className="flex-1 bg-black/40 border-neutral-700 text-white placeholder:text-neutral-500"
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
            className="bg-white text-black hover:bg-neutral-200"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

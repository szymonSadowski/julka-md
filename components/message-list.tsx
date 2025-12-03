import { api } from "@/convex/_generated/api";
import { useThreadMessages } from "@convex-dev/agent/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import Image from "next/image";
import Markdown from "react-markdown";
import { MarkdownRenderer } from "./markdown-renderer";
import { useEffect, useRef } from "react";

type MessageListPropts = {
  threadId: string;
  onMessagesChange?: () => void;
};

export const MessageList = ({
  threadId,
  onMessagesChange,
}: MessageListPropts) => {
  const messagesResult = useThreadMessages(
    api.chat.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true }
  );

  const messages = messagesResult?.results || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const prevMessagesRef = useRef(messages);

  // Scroll to bottom when messages change (new messages or content updates)
  useEffect(() => {
    const hasNewMessages = messages.length > prevMessageCountRef.current;
    const hasContentChange =
      messages.length > 0 &&
      prevMessagesRef.current.length > 0 &&
      messages[messages.length - 1]?.text !==
        prevMessagesRef.current[prevMessagesRef.current.length - 1]?.text;

    if (hasNewMessages || hasContentChange) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
      onMessagesChange?.();
    }

    prevMessageCountRef.current = messages.length;
    prevMessagesRef.current = messages;
  }, [messages, onMessagesChange]);

  if (messages.length === 0) {
    return (
      <div className="text-neutral-500 text-sm text-center py-8">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto overflow-y-auto">
      {messages.map((message, index) => {
        const isUser = message.message?.role === "user";

        return (
          <div
            key={message._id || index}
            className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
          >
            <Avatar
              className={`${isUser ? "bg-white" : "bg-neutral-800"} border-2 border-neutral-700 h-12 w-12 shrink-0`}
            >
              <AvatarImage
                src={isUser ? "/julkamd.png" : "/donermd.png"}
                alt={isUser ? "User" : "Bot"}
                className="object-cover"
              />
            </Avatar>

            <div
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[70%]`}
            >
              <div
                className={`rounded-lg px-4 py-2 ${
                  isUser ? "bg-white text-black" : "bg-neutral-800 text-white"
                }`}
              >
                {message.text && <MarkdownRenderer children={message.text} />}
              </div>
              {message._creationTime && (
                <span className="text-xs text-neutral-500 mt-1 px-1">
                  {new Date(message._creationTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

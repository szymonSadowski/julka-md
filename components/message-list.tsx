import { api } from "@/convex/_generated/api";
import { useThreadMessages } from "@convex-dev/agent/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import Image from "next/image";
import Markdown from "react-markdown";
import { MarkdownRenderer } from "./markdown-renderer";

type MessageListPropts = {
  threadId: string;
};

export const MessageList = ({ threadId }: MessageListPropts) => {
  const messagesResult = useThreadMessages(
    api.chat.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true }
  );

  const messages = messagesResult?.results || [];

  if (messages.length === 0) {
    return (
      <div className="text-neutral-500 text-sm text-center py-8">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
    </div>
  );
};

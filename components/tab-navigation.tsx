"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Search } from "lucide-react";

export function TabNavigation() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Chat",
      href: "/",
      icon: MessageSquare,
      active: pathname === "/",
    },
    {
      name: "Search",
      href: "/search",
      icon: Search,
      active: pathname === "/search",
    },
  ];

  return (
    <div className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
      <div className="flex max-w-4xl mx-auto px-6 justify-end md:justify-start">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                tab.active
                  ? "border-white text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

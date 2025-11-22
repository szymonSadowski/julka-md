import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Julka MD - Medical Assistant",
    short_name: "Julka MD",
    description: "Your personal medical assistant powered by AI",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/square-logo-for-iphone.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/square-logo-for-iphone.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/square-logo-for-iphone.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "maskable",
      },
      {
        src: "/square-logo-for-iphone.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/header.webp",
        sizes: "1280x720",
        type: "image/webp",
        form_factor: "wide",
      },
    ],
    categories: ["health", "medical", "productivity"],
    shortcuts: [
      {
        name: "New Chat",
        short_name: "Chat",
        description: "Start a new chat conversation",
        url: "/?new=true",
        icons: [
          {
            src: "/square-logo-for-iphone.jpg",
            sizes: "192x192",
          },
        ],
      },
      {
        name: "Search Documents",
        short_name: "Search",
        description: "Search your medical documents",
        url: "/search",
        icons: [
          {
            src: "/square-logo-for-iphone.jpg",
            sizes: "192x192",
          },
        ],
      },
      {
        name: "Manage Files",
        short_name: "Files",
        description: "Upload and manage your documents",
        url: "/files",
        icons: [
          {
            src: "/square-logo-for-iphone.jpg",
            sizes: "192x192",
          },
        ],
      },
    ],
  };
}

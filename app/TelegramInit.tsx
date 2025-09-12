"use client";
import { useEffect } from "react";
import { init } from "@telegram-apps/sdk";

export function TelegramInit() {
  useEffect(() => {
    try {
      const isTMA = (() => {
        if (typeof window === "undefined") return false;
        try {
          // Check URL hash and search for Telegram Mini Apps markers
          const hash = window.location.hash?.startsWith("#")
            ? window.location.hash.slice(1)
            : window.location.hash || "";
          const hashParams = new URLSearchParams(hash);
          const searchParams = new URLSearchParams(window.location.search);
          if (
            hashParams.has("tgWebAppPlatform") ||
            searchParams.has("tgWebAppPlatform") ||
            hashParams.has("tgWebAppData") ||
            searchParams.has("tgWebAppData")
          ) {
            return true;
          }
          // Check Telegram object presence
          const tg = (window as any).Telegram;
          if (tg?.WebApp?.platform) return true;
        } catch {
          // ignore detection errors
        }
        return false;
      })();

      if (!isTMA) {
        return;
      }

      const destroy = init();
      return destroy;
    } catch {
      // Silently ignore initialization errors outside Telegram
      return;
    }
  }, []);
  return null;
}

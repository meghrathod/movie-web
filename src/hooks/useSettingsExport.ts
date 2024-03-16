import { useCallback } from "react";

import { Settings } from "@/hooks/useSettingsImport";
import { useAuthStore } from "@/stores/auth";
import { useBookmarkStore } from "@/stores/bookmarks";
import { useLanguageStore } from "@/stores/language";
import { usePreferencesStore } from "@/stores/preferences";
import { useProgressStore } from "@/stores/progress";
import { useQualityStore } from "@/stores/quality";
import { useSubtitleStore } from "@/stores/subtitles";
import { useThemeStore } from "@/stores/theme";
import { useVolumeStore } from "@/stores/volume";

export function useSettingsExport() {
  const authStore = useAuthStore();
  const bookmarksStore = useBookmarkStore();
  const languageStore = useLanguageStore();
  const preferencesStore = usePreferencesStore();
  const progressStore = useProgressStore();
  const qualityStore = useQualityStore();
  const subtitleStore = useSubtitleStore();
  const themeStore = useThemeStore();
  const volumeStore = useVolumeStore();

  const collect = useCallback(
    (includeAuth: boolean): Settings => {
      return {
        auth: {
          account: includeAuth ? authStore.account : undefined,
          backendUrl: authStore.backendUrl,
          proxySet: authStore.proxySet,
        },
        bookmarks: {
          bookmarks: bookmarksStore.bookmarks,
        },
        language: {
          language: languageStore.language,
        },
        preferences: {
          enableThumbnails: preferencesStore.enableThumbnails,
        },
        progress: {
          items: progressStore.items,
        },
        quality: {
          quality: {
            automaticQuality: qualityStore.quality.automaticQuality,
            lastChosenQuality: qualityStore.quality.lastChosenQuality,
          },
        },
        subtitles: {
          lastSelectedLanguage: subtitleStore.lastSelectedLanguage,
          styling: {
            backgroundBlur: subtitleStore.styling.backgroundBlur,
            backgroundOpacity: subtitleStore.styling.backgroundOpacity,
            color: subtitleStore.styling.color,
            size: subtitleStore.styling.size,
          },
          overrideCasing: subtitleStore.overrideCasing,
          delay: subtitleStore.delay,
        },
        theme: {
          theme: themeStore.theme,
        },
        volume: {
          volume: volumeStore.volume,
        },
      };
    },
    [
      authStore,
      bookmarksStore,
      languageStore,
      preferencesStore,
      progressStore,
      qualityStore,
      subtitleStore,
      themeStore,
      volumeStore,
    ],
  );

  const exportSettings = useCallback(
    (includeAuth: boolean) => {
      const output = JSON.stringify(collect(includeAuth), null, 2);

      const blob = new Blob([output], { type: "application/json" });
      const elem = window.document.createElement("a");
      elem.href = window.URL.createObjectURL(blob);

      const date = new Date();
      elem.download = `movie-web settings - ${
        date.toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    },
    [collect],
  );

  return exportSettings;
}

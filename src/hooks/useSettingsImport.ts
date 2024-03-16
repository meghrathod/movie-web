import { useCallback } from "react";
import { z } from "zod";

import { useAuthStore } from "@/stores/auth";
import { useBookmarkStore } from "@/stores/bookmarks";
import { useLanguageStore } from "@/stores/language";
import { usePreferencesStore } from "@/stores/preferences";
import { useProgressStore } from "@/stores/progress";
import { useQualityStore } from "@/stores/quality";
import { useSubtitleStore } from "@/stores/subtitles";
import { useThemeStore } from "@/stores/theme";
import { useVolumeStore } from "@/stores/volume";

const settingsSchema = z.object({
  auth: z.object({
    account: z
      .object({
        profile: z.object({
          colorA: z.string(),
          colorB: z.string(),
          icon: z.string(),
        }),
        sessionId: z.string(),
        userId: z.string(),
        token: z.string(),
        seed: z.string(),
        deviceName: z.string(),
      })
      .nullish(),
    backendUrl: z.string().nullable(),
    proxySet: z.array(z.string()).nullable(),
  }),
  bookmarks: z.object({
    bookmarks: z.record(
      z.object({
        title: z.string(),
        year: z.number().optional(),
        poster: z.string().optional(),
        type: z.enum(["show", "movie"]),
        updatedAt: z.number(),
      }),
    ),
  }),
  language: z.object({
    language: z.string(),
  }),
  preferences: z.object({
    enableThumbnails: z.boolean(),
  }),
  progress: z.object({
    items: z.record(
      z.object({
        title: z.string(),
        year: z.number().optional(),
        poster: z.string().optional(),
        type: z.enum(["show", "movie"]),
        updatedAt: z.number(),
        progress: z
          .object({
            watched: z.number(),
            duration: z.number(),
          })
          .optional(),
        seasons: z.record(
          z.object({
            title: z.string(),
            number: z.number(),
            id: z.string(),
          }),
        ),
        episodes: z.record(
          z.object({
            title: z.string(),
            number: z.number(),
            id: z.string(),
            seasonId: z.string(),
            updatedAt: z.number(),
            progress: z.object({
              watched: z.number(),
              duration: z.number(),
            }),
          }),
        ),
      }),
    ),
  }),
  quality: z.object({
    quality: z.object({
      automaticQuality: z.boolean(),
      lastChosenQuality: z
        .enum(["unknown", "360", "480", "720", "1080", "4k"])
        .nullable(),
    }),
  }),
  subtitles: z.object({
    lastSelectedLanguage: z.string().nullable(),
    styling: z.object({
      backgroundBlur: z.number(),
      backgroundOpacity: z.number(),
      color: z.string(),
      size: z.number(),
    }),
    overrideCasing: z.boolean(),
    delay: z.number(),
  }),
  theme: z.object({
    theme: z.string().nullable(),
  }),
  volume: z.object({
    volume: z.number(),
  }),
});

const settingsPartialSchema = settingsSchema.partial();

export type Settings = z.infer<typeof settingsSchema>;

export function useSettingsImport() {
  const authStore = useAuthStore();
  const bookmarksStore = useBookmarkStore();
  const languageStore = useLanguageStore();
  const preferencesStore = usePreferencesStore();
  const progressStore = useProgressStore();
  const qualityStore = useQualityStore();
  const subtitleStore = useSubtitleStore();
  const themeStore = useThemeStore();
  const volumeStore = useVolumeStore();

  const importSettings = useCallback(
    async (file: File) => {
      const text = await file.text();

      const data = settingsPartialSchema.parse(JSON.parse(text));
      if (data.auth?.account) authStore.setAccount(data.auth.account);
      if (data.auth?.backendUrl) authStore.setBackendUrl(data.auth.backendUrl);
      if (data.auth?.proxySet) authStore.setProxySet(data.auth.proxySet);
      if (data.bookmarks) {
        for (const [id, item] of Object.entries(data.bookmarks.bookmarks)) {
          bookmarksStore.setBookmark(id, {
            title: item.title,
            type: item.type,
            year: item.year,
            poster: item.poster,
            updatedAt: item.updatedAt,
          });
        }
      }
      if (data.language) languageStore.setLanguage(data.language.language);
      if (data.preferences) {
        preferencesStore.setEnableThumbnails(data.preferences.enableThumbnails);
      }
      if (data.quality) {
        qualityStore.setAutomaticQuality(data.quality.quality.automaticQuality);
        qualityStore.setLastChosenQuality(
          data.quality.quality.lastChosenQuality,
        );
      }
      if (data.subtitles) {
        subtitleStore.setLanguage(data.subtitles.lastSelectedLanguage);
        subtitleStore.updateStyling(data.subtitles.styling);
        subtitleStore.setOverrideCasing(data.subtitles.overrideCasing);
        subtitleStore.setDelay(data.subtitles.delay);
      }
      if (data.theme) themeStore.setTheme(data.theme.theme);
      if (data.volume) volumeStore.setVolume(data.volume.volume);

      if (data.progress) {
        for (const [id, item] of Object.entries(data.progress.items)) {
          if (!progressStore.items[id]) {
            progressStore.setItem(id, item);
          }

          // We want to preserve existing progress so we take the max of the updatedAt and the progress
          const storeItem = progressStore.items[id];
          storeItem.updatedAt = Math.max(storeItem.updatedAt, item.updatedAt);
          storeItem.title = item.title;
          storeItem.year = item.year;
          storeItem.poster = item.poster;
          storeItem.type = item.type;
          storeItem.progress = item.progress
            ? {
                duration: item.progress.duration,
                watched: Math.max(
                  storeItem.progress?.watched ?? 0,
                  item.progress.watched,
                ),
              }
            : undefined;

          for (const [seasonId, season] of Object.entries(item.seasons)) {
            storeItem.seasons[seasonId] = season;
          }

          for (const [episodeId, episode] of Object.entries(item.episodes)) {
            if (!storeItem.episodes[episodeId]) {
              storeItem.episodes[episodeId] = episode;
            }

            const storeEpisode = storeItem.episodes[episodeId];
            storeEpisode.updatedAt = Math.max(
              storeEpisode.updatedAt,
              episode.updatedAt,
            );
            storeEpisode.title = episode.title;
            storeEpisode.number = episode.number;
            storeEpisode.seasonId = episode.seasonId;
            storeEpisode.progress = {
              duration: episode.progress.duration,
              watched: Math.max(
                storeEpisode.progress.watched,
                episode.progress.watched,
              ),
            };
          }

          progressStore.setItem(id, storeItem);
        }
      }
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

  return importSettings;
}

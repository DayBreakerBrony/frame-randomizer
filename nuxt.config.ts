// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from "nuxt/config";

/* eslint sort-keys: "error" */
export default defineNuxtConfig({
  devtools: {
    enabled: false, // Toggle this to enable devtools.
  },

  imports: {
    autoImport: false,
  },

  modules: ["@pinia/nuxt", "nuxt-security"],

  nitro: {
    esbuild: {
      options: {
        target: "node18",
      },
    },
  },

  // These can be set per the instructions in
  // https://nuxt.com/docs/guide/directory-structure/env. All options that are
  // undefined here are required to be set in env params.
  runtimeConfig: {
    // Whether to error out if episodes are missing, or simply print a warning.
    allowMissingEpisodes: true,
    // Where the episode data config is.
    episodeDataPath: undefined,
    // How often to check imageOutputDir and answer storage for expired images.
    imageCleanupIntervalMs: 30 * 60 * 1000, // 30 minutes.
    imageExpiryMs: 10 * 60 * 1000, // 10 minutes.
    imageGenMaxParallelism: 3,
    // Where generated images will be outputted to and served from.
    imageOutputDir: "/tmp/genimg",
    imagePregenCount: 10,
    public: {
      imageOutputExtension: "webp",
      // Instance name shown to users.
      instanceName: undefined,
    },
    // Whether to search subdirectories of videoSourceDir. Directory path is not
    // considered when deciding season/episode number, only filename.
    searchVideoDirRecursively: false,
    // Used to give generated images random names. Recommend setting this to a
    // different one for your own instance from:
    // https://www.uuidtools.com/generate/v4
    uuidNamespace: "b219dcdb-c910-417c-8403-01c6b40c5fb4",
    // Where source videos are found. Files should include the season and
    // episode numbers in SxxExx or xx,xx format or similar.
    videoSourceDir: undefined,
  },

  security: {
    headers: {
      // Allow devtools to work.
      crossOriginEmbedderPolicy:
        process.env.NODE_ENV === "development" ? "unsafe-none" : "require-corp",
    },
    rateLimiter: {
      interval: "hour",
      throwError: false,
      // One generated image and guess every 5 seconds.
      tokensPerInterval: 720 * 2,
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },
});

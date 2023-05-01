// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from "nuxt/config";

const instanceName = "Showguesser";

/* eslint sort-keys: "error" */
export default defineNuxtConfig({
  app: {
    head: {
      title: instanceName,
    },
  },

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

  runtimeConfig: {
    allowMissingEpisodes: true,
    episodeDataPath: `/home/${process.env.USER}/projects/showguesser_data/mlp3.json`,
    imageOutputDir: "/tmp/image_gen",
    public: {
      imageOutputExtension: "png",
      instanceName,
    },
    replayPreSec: 4,
    searchVideoDirRecursively: false,
    uuidNamespace: "b219dcdb-c910-417c-8403-01c6b40c5fb4",
    videoSourceDir: `/home/${process.env.USER}/Downloads/mlp`,
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

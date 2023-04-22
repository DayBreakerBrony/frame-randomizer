// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from "nuxt/config";

const instanceName = "Showguesser";

export default defineNuxtConfig({
  app: {
    head: {
      title: instanceName,
    },
  },
  imports: {
    autoImport: false,
  },
  modules: ["@pinia/nuxt"],
  nitro: {
    esbuild: {
      options: {
        target: "node18",
      },
    },
  },
  runtimeConfig: {
    allowMissingEpisodes: true,
    episodeDataPath: `/home/${process.env.USER}/projects/showguesser_data/mlp.json`,
    imageOutputDir: "/tmp/image_gen",
    replayPreSec: 4,
    uuidNamespace: "b219dcdb-c910-417c-8403-01c6b40c5fb4",
    searchVideoDirRecursively: false,
    videoSourceDir: `/home/${process.env.USER}/Downloads/mlp`,

    public: {
      imageOutputExtension: "png",
      instanceName,
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
});

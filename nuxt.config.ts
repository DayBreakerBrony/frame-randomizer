// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from "nuxt/config";
import GraphemeSplitter from "grapheme-splitter";

const splitter = new GraphemeSplitter();

// Default limit equivalent to 1 frame / 5 seconds average load.
const frameLimitPerHour =
  parseInt(process.env.FR_REQUEST_LIMIT || "0") || Math.round((60 * 60) / 5);
const requestLimitPerHour = frameLimitPerHour * 4; // There are 4 requests per frame.

/* eslint sort-keys: "error" */
export default defineNuxtConfig({
  app: {
    head: {
      // If given, all the characters in FR_FAVICON_EMOJI will be drawn on top
      // of each other one by one to create a favicon. Otherwise, we have a
      // default png favicon.
      link: process.env.FR_FAVICON_EMOJI // A good example value is 🎞️.
        ? [
            {
              // Emojis aren't split properly by String.prototype.split.
              href: `data:image/svg+xml,${encodeURI(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${splitter
                  .splitGraphemes(process.env.FR_FAVICON_EMOJI)
                  .map((e) => `<text y="829" font-size="1000">${e}</text>`)
                  .join("")}</svg>`,
              )}`,
              rel: "icon",
            },
          ]
        : [
            {
              href: "/apple-touch-icon.png",
              rel: "apple-touch-icon",
              sizes: "180x180",
            },
            {
              href: "/favicon-32x32.png",
              rel: "icon",
              sizes: "32x32",
              type: "image/png",
            },
            {
              href: "/favicon-16x16.png",
              rel: "icon",
              sizes: "16x16",
              type: "image/png",
            },
            {
              href: "/site.webmanifest",
              rel: "manifest",
            },
          ],
      meta: [
        {
          content: "width=device-width, initial-scale=1",
          name: "viewport",
        },
        {
          charset: "utf-8",
        },
      ],
      noscript: [
        "Unfortunately, this site requires JavaScript. However, in principle, a no-JavaScript version could be made…",
      ],
    },
  },

  devtools: {
    enabled: false, // Toggle this to enable devtools.
  },

  i18n: {
    defaultLocale: "en",
    detectBrowserLanguage: {
      cookieKey: "i18n_redirected",
      fallbackLocale: "en",
      redirectOn: "root",
      useCookie: true,
    },
    langDir: "lang",
    lazy: true,
    locales: [
      { code: "de", file: "de.json", iso: "de", name: "Deutsch" },
      { code: "en", file: "en.json", iso: "en", name: "English" },
      { code: "fr", file: "fr.json", iso: "fr", name: "Français" },
      { code: "pl", file: "pl.json", iso: "pl", name: "Polski" },
      { code: "ru", file: "ru.json", iso: "ru", name: "русский" },
      { code: "zh", file: "zh.json", iso: "zh", name: "中文" },
    ],
    strategy: "prefix_except_default",
  },

  modules: [
    "@pinia/nuxt",
    "@pinia-plugin-persistedstate/nuxt",
    "@nuxtjs/i18n",
    "nuxt-security",
  ],

  nitro: {
    esbuild: {
      options: {
        target: "node18",
      },
    },

    storage: {
      answer: {
        base: process.env.FR_ANSWER_DIR || "./frame-randomizer/answer",
        driver: "fs",
      },

      archivedRun: {
        base:
          process.env.FR_RUN_VERIFICATION_STATE_DIR ||
          "./frame-randomizer/archived-run",
        driver: "fs",
      },

      ffprobeCache: {
        base:
          process.env.FR_FFPROBE_CACHE_DIR ||
          "./frame-randomizer/ffprobe-cache",
        driver: "fs",
      },

      frameState: {
        base:
          process.env.FR_FRAME_STATE_DIR || "./frame-randomizer/frame-state",
        driver: "fs",
      },

      runState: {
        base:
          process.env.FR_RUN_VERIFICATION_STATE_DIR ||
          "./frame-randomizer/run-state",
        driver: "fs",
      },
    },
  },

  routeRules: {
    "/api/frame/gen": {
      headers: {
        "cache-control": "no-cache, no-store",
      },
      security: {
        rateLimiter: {
          interval: "hour",
          tokensPerInterval: frameLimitPerHour,
        },
      },
    },
    "/api/frame/get/**": {
      headers: {
        // private: browser cache only, no CDN or Cloudflare cache.
        // immutable: image path is a UUID that will not change.
        // max-age: one week default, a reasonable guess for how long a user
        // might want the image to stick around
        "cache-control": `private, immutable, max-age=${
          process.env.FR_FRAME_CACHE_AGE || 60 * 60 * 24 * 7
        }`,
        // Change MIME type to image. Otherwise the browser might not know what
        // file type to save it as, Cloudflare analytics will be messed up, etc.
        // We would like to read from runtimeConfig.public.imageOutputExtension
        // directly, but there doesn't seem to be a good way to do this in Nuxt.
        "content-type": process.env.FR_IMAGE_CONTENT_TYPE,
      },
    },
    "/api/show": {
      headers: {
        "cache-control": `public, max-age=${
          process.env.FR_SHOW_CACHE_AGE || 60 * 60 * 8
        }`,
      },
    },
  },

  // These can be set per the instructions in
  // https://nuxt.com/docs/guide/directory-structure/env. All options that are
  // undefined here are required to be set in env params.
  //
  // This is unstable software; required options, option availability, and
  // option interpretation can change between versions. Check the changelog or
  // commit history when upgrading
  runtimeConfig: {
    // Whether to error out if episodes are missing, or simply print a warning.
    allowMissingEpisodes: true,
    // How long to keep an answer around for after a frame is served.
    answerExpiryMs: 4 * 60 * 60 * 1000, // 4 hours.
    // How often to check frameOutputDir, frame state storage, and answer
    // storage for expired or orphaned images.
    cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes.
    // If given, this will be injected into the ffmpeg command used to generate
    // the images. Useful for specifying image encoding/quality options. Consult
    // ffmpeg documentation (https://ffmpeg.org/ffmpeg-codecs.html).
    ffmpegImageCommandInject: undefined,
    // Path to ffmpeg binary, or "ffmpeg" to use the one from the system PATH.
    ffmpegPath: "ffmpeg",
    // On server initialization, ffprobe is used to find how long each episode
    // is. Limit ffprobe invocations to this number at a time. 0 or Infinity for
    // no limit.
    ffprobeInitialLoadLimit: Infinity,
    // Path to ffmpeg binary, or "ffmpeg" to use the one from the system PATH.
    ffprobePath: "ffprobe",
    // How many times to attempt frame generation before it's considered
    // unrecoverable.  Additionally, if frameRequiredStandardDeviation is set, a
    // minimum standard deviation is required. If image generation fails this
    // many times, give up and use the last generated image, waiving the
    // standard deviation requirement. While it will prevent frame generation
    // from hanging on frame generation indefinitely, hitting the limit will
    // still increase frame generation times significantly.
    frameGenMaxAttempts: 5,
    // Limit number of simultaneously generated frames to this amount.
    frameGenMaxParallelism: 3,
    // Where generated images will be outputted to and served from. Apparently
    // orphaned images will be cleaned out of this directory, so don't point it
    // to somewhere that has important data!
    frameOutputDir: "./frame-randomizer/frames",
    // Number of images to pregenerate. These will be ready for serving right
    // away, and will be replaced as soon as they're served.
    framePregenCount: 3,
    // Require a standard deviation (from ImageMagick's identify command) of
    // more than this amount. If unsure, consider testing with identify on some
    // borderline frames. Set to 0 to disable.
    frameRequiredStandardDeviation: 2500.0,
    // Path to ImageMagick identify command.
    imageMagickIdentifyPath: "identify",
    // Private key, used for signing verified runs.
    privateKey: "",
    // Per Nuxt documentation, these values will be sent to client-side code.
    public: {
      // Whether to include the disclaimer required by TMDB for use of its API
      // (see
      // https://developer.themoviedb.org/docs/faq#what-are-the-attribution-requirements).
      attributeTmdb: false,
      // Provide a custom format string for linking the source episode when
      // showing the answer. "{season}" and "{episode}" will be substituted.
      episodeUrlFormat: undefined,
      // How long to keep a frame image around for after it's released to a user
      // but not deleted.
      frameExpiryMs: 5 * 60 * 1000, // 10 minutes.
      // Number of characters required for a match. If the user inputs a search
      // shorter than this, nothing will happen.
      // https://fusejs.io/api/options.html#minmatchcharlength
      fuzzySearchMinMatchLength: 3,
      // The threshold used by Fuse for what is considered a match. Increasing
      // this will relax the match strictness.
      // https://fusejs.io/api/options.html#threshold.
      fuzzySearchThreshold: 0.2,
      // Weight assigned to the episode name, relative to synopsis.
      // https://fusejs.io/examples.html#weighted-search
      fuzzySearchWeightName: 1.0,
      // Weight assigned to the episode overview/synopsis, relative to name.
      // https://fusejs.io/examples.html#weighted-search
      fuzzySearchWeightSynopsis: 0.25,
      // What extension to output images as. Naturally, these have different
      // tradeoffs in terms of output filesize, generation/encoding time, etc.
      imageOutputExtension: "webp",
      // JSON instance info that will be shown in the About section.
      instanceInfoData: undefined,
      // Instance info that will be shown in the About section. This allows HTML
      // tags; use this if you want to include HTML. You might want to include a
      // way for users to contact you if there are problems, attribution or
      // acknowledgement to your data source (e.g. TMDB) or contributors, etc.
      instanceInfoHtml: undefined,
      // Instance info, but allowing plain text only; use this for safety if you
      // don't need to include HTML.
      instanceInfoText: undefined,
      // Required. Instance name shown to users.
      instanceName: undefined,
      // Description added to meta tags.
      metaDescription: "Frame randomizer instance",
      // Public key, which can be used to verify server signatures.
      publicKey: "",
      // Software version displayed in UI.
      softwareVersion: "0.0.20",
      // Link to your version of the source code. If you build and run a
      // modified version of this software to users over a network, the AGPL
      // requires you to provide users with a link to view/download your
      // modified version. If you don't provide a different link here, you
      // attest that your instance's code is unmodified.
      sourceCodeUrl: "https://github.com/steadygaze/frame-randomizer",
      // If attributing TMDB and this is given, also link the TMDB page.
      tmdbTvShowId: undefined,
    },
    // How long until unimportant runs are deleted.
    runExpiryMs: 1 * 60 * 60 * 1000, // 1 hour.
    // How many entries a run must have to be considered important.
    runRetentionThreshold: 100,
    // Whether to search subdirectories of videoSourceDir. Directory path is not
    // considered when matching files with the right episode, only filename.
    searchVideoDirRecursively: true,
    // Required. Where the show data is. See README.md and server/load.ts for
    // more info.
    showDataPath: undefined,
    // Whether the ffprobe FS cache will be used. If video files at the same
    // paths aren't expected to change (as in most use cases), this can remain
    // true for faster server restarts. Note that if this is false, the cache
    // isn't touched (not read from, cleared, or repopulated). If you need to
    // clear and repopulate the cache, simply "rm -r" the ffprobe cache
    // directory (see ffprobeCache.base).
    useFfprobeCache: true,
    // Used to give generated images random names. Recommend setting this to a
    // different one for your own instance from:
    // https://www.uuidtools.com/generate/v4
    uuidNamespace: "b219dcdb-c910-417c-8403-01c6b40c5fb4",
    // Video file extensions to look for videos for. The default list will
    // contain common video files; if you have a less common video format in
    // mind, it's better to set this explicitly.
    videoFileExtension: "avi,mkv,mov,mp4,webm",
    // Required. Where source videos are found. Files should include the season
    // and episode numbers in SxxExx or xx,xx format or similar.
    videoSourceDir: undefined,
  },

  security: {
    corsHandler: {
      origin: ["static.cloudflareinsights.com"],
    },
    headers: {
      // Allow devtools to work.
      crossOriginEmbedderPolicy:
        process.env.NODE_ENV === "development" ? "unsafe-none" : "require-corp",
    },
    rateLimiter: {
      interval: "hour",
      throwError: true,
      tokensPerInterval: requestLimitPerHour,
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },
});

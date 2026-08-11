/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep next-intl's request configuration available without loading its
  // optional extraction watcher. The watcher uses a native Windows module
  // that is blocked by this machine's Application Control policy.
  turbopack: {
    resolveAlias: {
      'next-intl/config': './i18n/request.ts',
    },
  },
  webpack(config) {
    config.resolve ??= {}
    config.resolve.alias ??= {}
    config.resolve.alias['next-intl/config'] = new URL('./i18n/request.ts', import.meta.url).pathname
    return config
  },
}

export default nextConfig

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@me-me-en/domain',
    '@me-me-en/application',
    '@me-me-en/infrastructure',
    '@me-me-en/contracts',
  ],
}

export default nextConfig

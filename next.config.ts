import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 's1.ticketm.net' },
      { protocol: 'https', hostname: '*.ticketmaster.com' },
      { protocol: 'https', hostname: 'resizer.ticketmaster.com' },
      { protocol: 'https', hostname: 'pict.myclubplasma.be' },
      { protocol: 'https', hostname: 'botanique.be' },
      { protocol: 'https', hostname: 'd3i6li5p17fo2k.cloudfront.net' },
      { protocol: 'https', hostname: 'www.halles.be' },
      { protocol: 'https', hostname: 'recyclart.be' },
      { protocol: 'https', hostname: 'www.lamonnaiedemunt.be' },
      { protocol: 'https', hostname: 'www.flagey.be' },
    ],
  },
};

export default nextConfig;

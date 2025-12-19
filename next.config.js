/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  async headers() {
    return [
      {
        // 모든 경로에 적용
        source: '/:path*',
        headers: [
          {
            // X-Frame-Options 제거 (Content-Security-Policy가 우선)
            key: 'X-Frame-Options',
            value: '',
          },
          {
            // 모든 도메인/IP에서 iframe 임베드 허용
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

// force rebuild Fri Dec 19 15:42:51 KST 2025

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Single source of truth for the version shown in the footer.
  env: {
    NEXT_PUBLIC_APP_VERSION: require("./package.json").version,
  },
};

module.exports = nextConfig;

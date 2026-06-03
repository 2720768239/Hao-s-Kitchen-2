import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));

const nextConfig = {
  turbopack: {
    root,
  },
};

export default nextConfig;

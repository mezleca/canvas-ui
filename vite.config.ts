import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
    root: "showcase",
    server: {
        port: 3000,
        host: true,
        fs: {
            allow: [resolve(__dirname)]
        }
    },
    build: {
        outDir: resolve(__dirname, "dist"),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                layout: resolve(__dirname, "showcase/layout/index.html"),
                game: resolve(__dirname, "showcase/game/index.html")
            }
        }
    }
});

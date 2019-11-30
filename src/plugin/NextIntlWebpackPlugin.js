import path from 'path';
import fs, { promises as pFs } from 'fs';
import chokidar from 'chokidar';
import { ConcatSource } from 'webpack-sources';
import { REACT_LOADABLE_MANIFEST } from 'next/dist/next-server/lib/constants';

export default class NextIntlWebpackPlugin {
    distDir;
    assetPrefix;

    manifestPath;
    initialManifestMtime;
    waitForManifestPromise;

    constructor(nextConfig) {
        this.distDir = nextConfig.distDir;
        this.assetPrefix = nextConfig.assetPrefix;

        this.manifestPath = path.join(this.distDir, REACT_LOADABLE_MANIFEST);
        this.initialManifestMtime = this.getLoadableManifestMtime(this.manifestPath);
    }

    apply(compiler) {
        compiler.hooks.afterPlugins.tap('NextIntlPlugin', () => {
            const currentManifestMtime = this.getLoadableManifestMtime();

            // Decide whether we need to wait for the manifest file to be written or not
            // We only need to wait if there's no manifest yet or if it was unchanged
            if (!currentManifestMtime || this.initialManifestMtime === currentManifestMtime) {
                this.waitForManifestPromise = this.waitForManifest();
            }
        });

        compiler.hooks.emit.tapPromise('NextIntlPlugin', async (compilation) => {
            await this.waitForManifestPromise;

            const polyfillUrl = await this.readPolyfillUrlFromManifest();
            const polyfillUrlCode = `__NEXT_INTL_POLYFILL_URL__ = ${JSON.stringify(polyfillUrl)};`;

            compilation.chunks
            .filter((chunk) => chunk.canBeInitial())
            .reduce((files, chunk) => {
                files.push(...chunk.files);

                return files;
            }, [])
            .forEach((file) => {
                compilation.assets[file] = new ConcatSource(polyfillUrlCode, compilation.assets[file]);
            });
        });
    }

    getLoadableManifestMtime() {
        let stats;

        try {
            stats = fs.statSync(path.join(this.distDir, REACT_LOADABLE_MANIFEST));
        } catch (err) {
            return null;
        }

        return stats.mtimeMs;
    }

    async waitForManifest() {
        const watcher = chokidar.watch([
            '.',
            this.distDir,
        ], {
            persistent: true,
            awaitWriteFinish: true,
            ignoreInitial: true,
            depth: 0,
        });

        watcher.on('addDir', (filepath) => {
            if (filepath === this.distDir) {
                watcher.add(filepath);
            }
        });

        try {
            await new Promise((resolve) => {
                watcher.on('add', (filepath) => {
                    if (filepath === this.manifestPath) {
                        resolve(filepath);
                    }
                });

                watcher.on('change', (filepath) => {
                    if (filepath === this.manifestPath) {
                        resolve(filepath);
                    }
                });
            });
        } finally {
            watcher.close();
        }
    }

    async readPolyfillUrlFromManifest() {
        const manifestContents = await pFs.readFile(this.manifestPath);
        const manifestJson = JSON.parse(manifestContents);

        const polyfillPublicPath = manifestJson['@formatjs/intl-pluralrules/polyfill-locales']?.[0]?.publicPath;

        if (!polyfillPublicPath) {
            throw new Error(`Could not find intl-polyfill chunk in ${this.manifestPath}`);
        }

        return `${this.assetPrefix}/_next/${polyfillPublicPath}`;
    }
}

import path from 'path';
import { promises as fs } from 'fs';
import chokidar from 'chokidar';
import { ConcatSource } from 'webpack-sources';
import { REACT_LOADABLE_MANIFEST } from 'next/dist/next-server/lib/constants';

const resolveLoadableManifestPath = async (distDir) => {
    const manifestPath = path.join(distDir, REACT_LOADABLE_MANIFEST);

    const watcher = chokidar.watch([
        '.',
        distDir,
    ], {
        persistent: true,
        awaitWriteFinish: true,
        ignoreInitial: true,
        depth: 0,
    });

    watcher.on('addDir', (filepath) => {
        if (filepath === distDir) {
            watcher.add(filepath);
        }
    });

    let loadableManifestPath;

    try {
        loadableManifestPath = await new Promise((resolve) => {
            watcher.on('add', (filepath) => {
                if (filepath === manifestPath) {
                    resolve(filepath);
                }
            });

            watcher.on('change', (filepath) => {
                if (filepath === manifestPath) {
                    resolve(filepath);
                }
            });
        });
    } finally {
        watcher.close();
    }

    return loadableManifestPath;
};

const getPolyfillUrl = (manifestJson, assetPrefix) => {
    const polyfillPublicPath = manifestJson?.['@formatjs/intl-pluralrules/polyfill-locales']?.[0]?.publicPath;

    if (!polyfillPublicPath) {
        throw new Error(`Could not find intl-polyfill chunk in ${REACT_LOADABLE_MANIFEST} asset`);
    }

    return `${assetPrefix}/_next/${polyfillPublicPath}`;
};

export default class NextIntlWebpackPlugin {
    constructor(nextConfig) {
        this.nextConfig = nextConfig;
    }

    apply(compiler) {
        compiler.hooks.afterPlugins.tap('NextIntlPlugin', () => {
            const { distDir, assetPrefix } = this.nextConfig;

            this.polyfillUrlPromise = resolveLoadableManifestPath(distDir)
            .then(fs.readFile)
            .then(JSON.parse)
            .then((manifestJson) => getPolyfillUrl(manifestJson, assetPrefix));
        });

        compiler.hooks.emit.tapPromise('NextIntlPlugin', async (compilation) => {
            const polyfillUrl = await this.polyfillUrlPromise;
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
}

/* istanbul ignore file */
import path from 'path';
import { promises as pFs } from 'fs';
import { ConcatSource } from 'webpack-sources';
import pDefer from 'p-defer';
import { REACT_LOADABLE_MANIFEST } from 'next/dist/next-server/lib/constants';

export default class NextIntlWebpackPlugin {
    static clientDeferred;

    distDir;
    assetPrefix;

    manifestPath;
    polyfillUrl;

    constructor(isServer, nextConfig) {
        this.isServer = isServer;
        this.distDir = nextConfig.distDir;
        this.assetPrefix = nextConfig.assetPrefix;

        this.manifestPath = path.join(this.distDir, REACT_LOADABLE_MANIFEST);
    }

    apply(compiler) {
        if (!this.isServer) {
            NextIntlWebpackPlugin.clientDeferred = pDefer();
            NextIntlWebpackPlugin.clientDeferred.promise.catch(() => {});

            compiler.hooks.failed.tap('NextIntlPlugin', (err) => {
                NextIntlWebpackPlugin.clientDeferred.reject(err);
            });

            compiler.hooks.done.tap('NextIntlPlugin', (stats) => {
                if (stats.hasErrors()) {
                    NextIntlWebpackPlugin.clientDeferred.reject(new Error('Client-side compilation has errors, fix them first'));
                } else {
                    NextIntlWebpackPlugin.clientDeferred.resolve();
                }
            });
        } else {
            compiler.hooks.emit.tapPromise('NextIntlPlugin', async (compilation) => {
                let polyfillUrl;

                try {
                    await NextIntlWebpackPlugin.clientDeferred.promise;

                    polyfillUrl = await this.readPolyfillUrlFromManifest();
                } catch (err) {
                    compilation.errors.push(err);

                    return;
                }

                compilation.chunks
                    .filter((chunk) => chunk.canBeInitial())
                    .reduce((files, chunk) => {
                        files.push(...chunk.files);

                        return files;
                    }, [])
                    .forEach((file) => {
                        const polyfillUrlCode = `__NEXT_INTL_POLYFILL_URL__ = ${JSON.stringify(polyfillUrl)};`;

                        compilation.assets[file] = new ConcatSource(polyfillUrlCode, compilation.assets[file]);
                    });
            });
        }
    }

    async readPolyfillUrlFromManifest() {
        // We may cache the `polyfillUrl` because it doesn't change between compilations in watch mode
        if (!this.polyfillUrl) {
            const manifestContents = await pFs.readFile(this.manifestPath);
            const manifestJson = JSON.parse(manifestContents);

            const polyfillFile = manifestJson['@formatjs/intl-pluralrules/polyfill-locales']?.[0]?.file;

            if (!polyfillFile) {
                throw new Error(`Could not find intl-polyfill chunk in ${this.manifestPath}, did you forgot to wrap your app with 'withNextIntlSetup'?`);
            }

            this.polyfillUrl = `${this.assetPrefix}/_next/${polyfillFile}`;
        }

        return this.polyfillUrl;
    }
}

/* istanbul ignore file */
import path from 'path';
import { promises as pFs } from 'fs';
import { ConcatSource } from 'webpack-sources';
import pDefer from 'p-defer';
import { minify } from 'terser';
import { REACT_LOADABLE_MANIFEST } from 'next/dist/next-server/lib/constants';

export default class NextIntlWebpackPlugin {
    static clientDeferred;

    distDir;
    assetPrefix;

    manifestPath;
    polyfills;

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
                let polyfills;

                try {
                    await NextIntlWebpackPlugin.clientDeferred.promise;

                    polyfills = await this.createPolyfillsFromManifest();
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
                        const polyfillsCode = `__NEXT_INTL_POLYFILLS__ = ${JSON.stringify(polyfills)};`;

                        compilation.assets[file] = new ConcatSource(polyfillsCode, compilation.assets[file]);
                    });
            });
        }
    }

    async createPolyfillsFromManifest() {
        // We may cache the `polyfillUrls` because it doesn't change between compilations in watch mode.
        if (!this.polyfills) {
            const manifestContents = await pFs.readFile(this.manifestPath);
            const manifestJson = JSON.parse(manifestContents);

            this.polyfills = await Promise.all([
                this.buildPolyfill(manifestJson, '@formatjs/intl-locale/polyfill'),
                this.buildPolyfill(manifestJson, '@formatjs/intl-pluralrules/polyfill-locales'),
                this.buildPolyfill(manifestJson, '@formatjs/intl-relativetimeformat/polyfill-locales'),
                this.buildPolyfill(manifestJson, '@formatjs/intl-displaynames/polyfill-locales'),
            ]);
        }

        return this.polyfills;
    }

    async buildPolyfill(manifestJson, module) {
        const moduleManifestFile = manifestJson[module]?.[0]?.file;

        if (!moduleManifestFile) {
            throw new Error(`Could not find ${module} in ${this.manifestPath}, did you forgot to wrap your app with 'withNextIntlSetup'?`);
        }

        const modulePath = require.resolve(module);
        const shouldPolyfillPath = path.join(path.dirname(modulePath), 'should-polyfill.js');

        const shouldPolyfill = await pFs.readFile(shouldPolyfillPath);
        const shouldPolyfillMinifyResult = await minify(shouldPolyfill.toString());

        return {
            asset: `${this.assetPrefix}/_next/${moduleManifestFile}`,
            shouldPolyfill: shouldPolyfillMinifyResult.code,
        };
    }
}

import * as esbuild from 'esbuild';
import fs from 'node:fs';

const [env] = process.argv.slice(2);
const entryPoints = ['client/app-init.ts', 'client/app.ts'];

const metafilePlugin = {
  name: 'metafileWriter',
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length === 0) {
        const out = {};
        Object.keys(result.metafile.outputs).forEach((dest) => {
          const data = result.metafile.outputs[dest];
          if (data.entryPoint) {
            // Remove prefixes. They are not included in the public URL.
            out[data.entryPoint.replace('client/', '')] = dest.replace('src', '');
          }
        });
        fs.writeFileSync(
          baseConfig.outdir + '/assets.json',
          JSON.stringify(out, null, 2),
        );
      }
    });
  },
};

const baseConfig = {
  entryPoints,
  bundle: true,
  outdir: 'src/assets/js',
  publicPath: 'assets/js',
  entryNames: '[name]-[hash]',
  assetNames: '[name]-[hash]',
  chunkNames: '[name][hash]',
  metafile: true,
  logLevel: 'info',
  //splitting: true,
  //format: 'esm',
  plugins: [metafilePlugin],
  loader: {
    '.js': 'jsx',
    '.json': 'json',
    '.png': 'file',
    '.woff': 'file',
    '.woff2': 'file',
    '.eot': 'file',
    '.ttf': 'file',
    '.svg': 'file',
    '.jpg': 'file',
    '.lazy.json': 'file',
  },
};

if (env === 'dev') {
  const ctx = await esbuild.context({
    ...baseConfig,
    sourcemap: 'inline',
  });
  await ctx.watch();
} else {
  await esbuild.build({
    ...baseConfig,
    sourcemap: 'external',
    treeShaking: true,
    minify: true,
  });
}

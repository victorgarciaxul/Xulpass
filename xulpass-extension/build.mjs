import esbuild from 'esbuild'

const shared = {
  bundle: true,
  target: ['chrome112'],
  platform: 'browser',
  minify: false,
}

await Promise.all([
  esbuild.build({
    ...shared,
    entryPoints: ['src/popup/index.ts'],
    outfile: 'popup.js',
  }),
  esbuild.build({
    ...shared,
    entryPoints: ['src/background/index.ts'],
    outfile: 'background.js',
    format: 'esm',
  }),
  esbuild.build({
    ...shared,
    entryPoints: ['src/content/index.ts'],
    outfile: 'content.js',
  }),
])

console.log('✅ Build completado')

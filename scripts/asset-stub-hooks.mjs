// Hook resolve/load Node ESM: menstubkan import file gambar (.jpg, .png, dst)
// yang normalnya cuma bisa diproses bundler (Vite). Di luar Vite (dijalankan
// lewat tsx untuk prerender), import semacam itu cukup di-resolve jadi string
// path apa adanya — nilainya sendiri tidak pernah dipakai oleh script
// prerender (cuma numpang lewat lewat modul data seperti portfolioData.ts).
const ASSET_RE = /\.(png|jpe?g|gif|svg|webp|avif|ico)(\?.*)?$/i;

export async function resolve(specifier, context, nextResolve) {
  if (ASSET_RE.test(specifier)) {
    return { url: 'asset-stub:' + specifier, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('asset-stub:')) {
    return {
      format: 'module',
      source: `export default ${JSON.stringify(url.slice('asset-stub:'.length))};`,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}

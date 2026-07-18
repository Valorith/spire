export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
    const hasExtension = /\.[a-z0-9]+$/i.test(specifier);
    if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !isRelative || hasExtension) {
      throw error;
    }
    return nextResolve(`${specifier}.js`, context);
  }
}

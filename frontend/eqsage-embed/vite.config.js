import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs';

const silenceSomeSassDeprecationWarnings = {
  verbose: true,
  logger : {
    warn(message, options) {
      const { stderr } = process;
      const span = options.span ?? undefined;
      const stack =
        (options.stack === 'null' ? undefined : options.stack) ?? undefined;

      if (options.deprecation) {
        if (
          message.startsWith(
            'Using / for division outside of calc() is deprecated'
          )
        ) {
          // silences above deprecation warning
          return;
        }
        stderr.write('DEPRECATION ');
      }
      stderr.write(`WARNING: ${message}\n`);

      if (span !== undefined) {
        // output the snippet that is causing this warning
        stderr.write(`\n"${span.text}"\n`);
      }

      if (stack !== undefined) {
        // indent each line of the stack
        stderr.write(
          `    ${stack.toString().trimEnd().replace(/\n/gm, '\n    ')}\n`
        );
      }

      stderr.write('\n');
    },
  },
};

export default defineConfig({
  plugins: [
    react(),
    esbuildCommonjs(['spire-api']),
  ],
  optimizeDeps: {
    include: [
      'spire-api',
      '@babylonjs/core',
      '@babylonjs/gui',
      '@babylonjs/inspector',
    ],
  },
  build: {
    outDir  : path.resolve(__dirname, '../public/eqsage-embed'),
    emptyOutDir: true,
    assetsDir: 'assets',
    cssCodeSplit: false,
    lib: {
      entry   : path.resolve(__dirname, 'src/embed-entry.jsx'),
      formats : ['es'],
      fileName: () => 'eqsage-embed.js',
      name    : 'SpireEqSageEmbed',
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name === 'style.css'
            ? 'eqsage-embed.css'
            : 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'eqsage-embed.js',
      },
    },
    target   : 'esnext',
    minify   : 'esbuild',
    sourcemap: true, // process.env.NODE_ENV !== 'production',
  },
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
      util  : 'util/',
      '@bjs': path.resolve(__dirname, 'src/bjs'),
      '@'   : path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        ...silenceSomeSassDeprecationWarnings,
      },
      sass: {
        ...silenceSomeSassDeprecationWarnings,
      },
    },
  },
  define: {
    'process.env': {},
  },
});

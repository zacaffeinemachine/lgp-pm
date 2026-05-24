import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// KaTeX macros so the web pages can use the same notation as the LaTeX notes.
const katexOptions = {
  macros: {
    "\\P": "\\mathbb{P}",
    "\\E": "\\mathbb{E}",
    "\\Var": "\\operatorname{Var}",
    "\\Cov": "\\operatorname{Cov}",
    "\\set": "\\{#1\\}",
    "\\abs": "\\lvert #1 \\rvert",
    "\\one": "\\mathbf{1}",
  },
};

export default defineConfig({
  site: 'https://zacaffeinemachine.github.io',
  base: '/lgp-pm',
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, katexOptions]],
    }),
    react(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, katexOptions]],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});

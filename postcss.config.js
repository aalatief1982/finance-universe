import tailwindPostCSS from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

/** @type {import('postcss').Config} */
export default {
  plugins: {
    '@tailwindcss/postcss': tailwindPostCSS,
    autoprefixer,
  },
};

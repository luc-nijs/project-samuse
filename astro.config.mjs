import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.project-samuse.lu',
  // Old Wix addresses that get a real name, so existing links keep working.
  redirects: {
    '/samuse-about': '/project',
    '/samuse-symposium': '/symposium',
    '/general-5': '/keynotes-abstracts',
    '/copy-of-keynotes-abstracts': '/phd-abstracts',
    '/about-6': '/schedule',
    '/copy-of-symposium-2026': '/media',
    '/join': '/study',
    '/samuse-team': '/team',
  },
});

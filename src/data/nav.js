// The menu, in the order of the Wix site.
export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Project', href: '/project' },
  {
    label: 'Symposium 2026', href: '/symposium',
    children: [
      { label: 'Keynotes Abstracts', href: '/keynotes-abstracts' },
      { label: 'PhD Abstracts', href: '/phd-abstracts' },
      { label: 'Schedule', href: '/schedule' },
      { label: 'Media Symposium 2026', href: '/media' },
    ],
  },
  { label: 'Study', href: '/study' },
  { label: 'Dissemination', href: '/dissemination' },
  { label: 'Team', href: '/team' },
  { label: 'Contact', href: '/contact' },
];

// The registration form linked from the "Join our study" buttons.
export const JOIN_FORM = 'https://forms.gle/zHszMLzNzSkaVikx7';

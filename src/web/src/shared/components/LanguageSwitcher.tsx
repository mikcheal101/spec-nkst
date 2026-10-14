import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'tiv', label: 'Tiv' },
  { code: 'ha', label: 'Hausa' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = languages.find((l) => l.code === i18n.language) || languages[0]
  return (
    <div className="language-switcher">
      <svg className="lang-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <span className="lang-code">{current.code.toUpperCase()}</span>
      <svg className="lang-chevron" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
      <select
        value={i18n.language}
        onChange={(e) => { i18n.changeLanguage(e.target.value); localStorage.setItem('i18nextLng', e.target.value); }}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
}

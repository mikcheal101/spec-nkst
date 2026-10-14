import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ha from './ha.json';
import tiv from './tiv.json';
import fr from './fr.json';

const stored = localStorage.getItem('i18nextLng');
const valid = ['en', 'fr', 'tiv', 'ha'];

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ha: { translation: ha }, tiv: { translation: tiv }, fr: { translation: fr } },
  lng: stored && valid.includes(stored) ? stored : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;

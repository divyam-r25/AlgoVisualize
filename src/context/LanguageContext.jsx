import { createContext, useCallback, useState } from 'react';

export const LANGUAGES = {
  JAVASCRIPT: 'javascript',
  PYTHON: 'python',
  JAVA: 'java',
  CPP: 'cpp',
};

export const LANGUAGE_INFO = {
  [LANGUAGES.JAVASCRIPT]: {
    name: 'JavaScript',
    icon: '⚡',
    monacoLanguage: 'javascript',
    extension: '.js',
  },
  [LANGUAGES.PYTHON]: {
    name: 'Python',
    icon: '🐍',
    monacoLanguage: 'python',
    extension: '.py',
  },
  [LANGUAGES.JAVA]: {
    name: 'Java',
    icon: '☕',
    monacoLanguage: 'java',
    extension: '.java',
  },
  [LANGUAGES.CPP]: {
    name: 'C++',
    icon: '⚙️',
    monacoLanguage: 'cpp',
    extension: '.cpp',
  },
};

export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(LANGUAGES.JAVASCRIPT);

  const switchLanguage = useCallback((language) => {
    if (LANGUAGE_INFO[language]) {
      setCurrentLanguage(language);
    }
  }, []);

  const value = {
    currentLanguage,
    switchLanguage,
    languages: LANGUAGES,
    languageInfo: LANGUAGE_INFO,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

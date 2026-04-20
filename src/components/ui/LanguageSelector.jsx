import { useLanguage } from '../../hooks/useLanguage';
import styles from './LanguageSelector.module.css';

export function LanguageSelector() {
  const { currentLanguage, switchLanguage, languages, languageInfo } = useLanguage();

  return (
    <div className={styles.languageSelector}>
      <label htmlFor="language-select" className={styles.label}>
        Language:
      </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={(e) => switchLanguage(e.target.value)}
        className={styles.select}
      >
        {Object.entries(languages).map(([key, value]) => (
          <option key={key} value={value}>
            {languageInfo[value].icon} {languageInfo[value].name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function LanguageSelectorButton() {
  const { currentLanguage, switchLanguage, languages, languageInfo } = useLanguage();

  return (
    <div className={styles.languageSelectorButton}>
      {Object.entries(languages).map(([key, value]) => (
        <button
          key={key}
          onClick={() => switchLanguage(value)}
          className={`${styles.languageButton} ${
            currentLanguage === value ? styles.active : ''
          }`}
          title={languageInfo[value].name}
        >
          <span className={styles.icon}>{languageInfo[value].icon}</span>
          <span className={styles.name}>{languageInfo[value].name}</span>
        </button>
      ))}
    </div>
  );
}

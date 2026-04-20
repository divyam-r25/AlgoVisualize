import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../hooks/useLanguage';
import { useExecutionContext } from '../../context/ExecutionContext';
import { LANGUAGE_INFO } from '../../context/LanguageContext';
import { LANGUAGE_TEMPLATES } from '../../services/languageTemplates';

const PAGE_TITLES = {
  '/editor': 'Code Editor',
  '/history': 'Execution History',
  '/saved': 'Saved Sessions',
  '/library': 'Algorithm Library',
};

export default function EditorNavbar() {
  const { pathname } = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { currentLanguage, switchLanguage } = useLanguage();
  const { actions } = useExecutionContext();
  const isEditorPage = pathname === '/editor';
  const title = PAGE_TITLES[pathname] || 'AlgoVisualize';

  const handleLanguageChange = (value) => {
    switchLanguage(value);
    // Load matching starter code for the new language
    if (LANGUAGE_TEMPLATES[value]) {
      actions.loadCode(LANGUAGE_TEMPLATES[value]);
    }
  };

  return (
    <header className="editor-navbar">
      <Link to="/home" className="back-btn">
        ← Back
      </Link>

      <span className="editor-navbar-title">{title}</span>

      <div className="editor-navbar-right">
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? <>☀️ <span>Light</span></> : <>🌙 <span>Dark</span></>}
        </button>

        {isEditorPage && (
          <select
            className="lang-selector"
            value={currentLanguage}
            onChange={e => handleLanguageChange(e.target.value)}
            aria-label="Programming language"
          >
            {Object.entries(LANGUAGE_INFO).map(([value, info]) => (
              <option key={value} value={value}>
                {info.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </header>
  );
}

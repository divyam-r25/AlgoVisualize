# Algorithm Visualizer - Production Edition 🚀

> **Interactive algorithm visualization with multi-language support, secure authentication, and production-ready deployment**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-19.2-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.12-orange)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

Interactive, deterministic algorithm execution visualizer built with React + Vite + Firebase.

**New in Production Edition:** Google Auth, Multi-language support (Python, Java, C++), Advanced metrics, Cloud persistence

---

## ✨ Key Features

### 🔐 Production Authentication
- ✅ **Google Sign-In** - OAuth 2.0 with Firebase
- ✅ **User Profiles** - Personal dashboard and history
- ✅ **Cloud Persistence** - Firestore database
- ✅ **Protected Routes** - Authenticated access only

### 🐍 Multi-Language Support (NEW)
```
✅ JavaScript (ES2024)
✅ Python 3.8+
✅ Java 11+
✅ C++ 17+
```
Switch languages with one click!

### 🎯 Advanced Execution Engine
- Monaco code editor with controlled input + gutter breakpoints
- Language-specific parsing (Acorn for JS, custom for Python/Java/C++)
- Deterministic AST-instruction execution engine (no direct eval)
- Reducer-driven execution state machine
- Breakpoint handling and runtime error state

### 📊 Enhanced Metrics & Visualization
- **Comparisons, Swaps, Array Accesses** - Real-time tracking
- **Time Complexity Analysis** - O(n) notation estimation
- **Execution Time** - Millisecond precision
- **D3 Array Visualizer** - Animated visualization
- **Call Stack & Trace Panels** - Full debugging support

### 💾 Session Management
- Save/load replay sessions (Firestore)
- Share sessions with others
- Session history with timestamps
- Execution replay capability

---

## 📋 Architecture

```
CodeEditor (Monaco)
  -> Language Selector
    -> parseAndValidate (Acorn/Custom parsers)
  -> compileProgram (instruction list)
  -> useExecution reducer state machine
      -> stepRuntime() deterministic execution
      -> trace records + metrics
  -> VisualizationCanvas
      -> ArrayVisualizer (D3)
      -> CallStackVisualizer
      -> ExecutionMetrics (NEW)
  -> PlayerControls / VariableInspector
```

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Local Development

```bash
cd AlgoVisualizer
npm install

# Set up Firebase (see SETUP_GUIDE.md for details)
cp .env.local.example .env.local
# Edit .env.local with Firebase credentials

npm run dev
# Open http://localhost:5173
```

### Build & Deploy

```bash
npm run build
# Deploy to Vercel or Firebase Hosting
vercel deploy --prod
```

---

## 🔥 Firebase Setup

**Complete guide:** See [SETUP_GUIDE.md](./SETUP_GUIDE.md)

**Quick steps:**
1. Create Firebase project
2. Enable Google Authentication
3. Create Firestore Database
4. Add credentials to `.env.local`
5. Configure authorized redirect URIs

---

## 📁 Project Structure

```
src/
  components/
    layout/              # Navbar (with auth + language selector)
    authentication/      # GoogleSignIn, ProtectedRoute (NEW)
    player/              # controls, metrics, inspector
    ui/                  # editor, language selector (NEW)
    visualization/       # array, graph, trace, metrics (NEW)
  context/
    AuthContext.jsx      # Google Auth + user state (NEW)
    LanguageContext.jsx  # Language selection (NEW)
    ExecutionContext.jsx # Execution state
    VisualizationContext.jsx
    CodeEditorContext.jsx
  hooks/
    useAuth.js           # Auth management (NEW)
    useLanguage.js       # Language management (NEW)
    useExecution.js
    useParser.js
  pages/
    LoginPage.jsx        # Google Sign-In (NEW)
    EditorPage.jsx
    AlgorithmLibraryPage.jsx
    SavedSessionsPage.jsx
  services/
    multiLanguageParser.js  # Python/Java/C++ parsers (NEW)
    firebase.js
    executionEngine.js
    algorithms/
  workers/
  test/
```

---

## 🎓 Supported Algorithms

- **Sorting:** Bubble, Selection, Insertion, Merge, Quick, Heap
- **Searching:** Linear, Binary
- **Graph:** BFS, DFS, Dijkstra
- **Trees:** Traversals, BST operations

See `src/services/algorithms/library.js`

---

## 🌐 Multi-Language Parsing

Each language has a dedicated parser:

| Language | Parser | Features |
|----------|--------|----------|
| JavaScript | Acorn | Full ES2024, AST-based |
| Python | Custom | Functions, classes, loops |
| Java | Custom | Methods, classes, control flow |
| C++ | Custom | Functions, includes, templates |

---

## 📊 Execution Metrics

| Metric | Description |
|--------|-------------|
| Comparisons | Total comparison operations |
| Swaps | Array element swaps |
| Array Accesses | Memory read/write operations |
| Time Complexity | Estimated O notation |
| Execution Time | Actual runtime (ms) |

---

## 🔒 Security

- ✅ Firebase OAuth 2.0 authentication
- ✅ Firestore security rules enforce user privacy
- ✅ HTTPS enforced in production
- ✅ No sensitive data in localStorage
- ✅ Environment variables for secrets

**Firestore Rules:** See `firestore.rules`

---

## 🛠 Tech Stack

### Frontend
- **React 19.2** - UI framework
- **React Router 7.14** - Routing
- **Vite 8** - Build tool
- **Monaco Editor 4.7** - Code editor
- **D3.js 7.9** - Visualization

### Backend
- **Firebase 12.12** - Auth + Database
- **Firestore** - Cloud NoSQL DB

### Development
- **ESLint** - Linting
- **Vitest** - Testing
- **Testing Library** - Component testing

---

## 📝 Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Check code quality
npm run test       # Run tests
npm run test:watch # Run tests in watch mode
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Connect GitHub to Vercel
# Add environment variables
# Auto-deploys on push to main
```

### Firebase Hosting

```bash
firebase init
firebase deploy
```

---

## 🐛 Troubleshooting

**"Firebase is not configured"**
→ Check `.env.local` file with Firebase credentials

**"Google Sign-In not working"**
→ Verify authorized redirect URI in Firebase Console

**"Permission denied" in Firestore**
→ Check Firestore rules are deployed and user authenticated

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed troubleshooting

---

## 📈 Performance

- **Lighthouse Score:** ~94
- **Bundle Size:** ~180KB gzipped
- **First Contentful Paint:** <2s

---

## 📜 License

MIT License - See LICENSE file

---

## 📞 Documentation

- 📖 **Full Setup Guide:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- 🔐 **Firebase Rules:** [firestore.rules](./firestore.rules)
- 📋 **Environment Template:** [.env.local.example](./.env.local.example)

---

## 🗺 Next Steps

1. **Get Started:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. **Deploy:** Follow Phase 4 in setup guide
3. **Customize:** Add your algorithms to the library
4. **Extend:** Build on multi-language support

---

**Production-Ready Algorithm Visualization Platform** ✨

Version 1.0.0 | Last Updated: April 2026

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useExecutionContext } from "../../context/ExecutionContext";
import { useCodeEditorContext } from "../../context/CodeEditorContext";

export default function CodeEditor() {
  const { state, actions, selectors } = useExecutionContext();
  const { setIsFocused, setCursorPosition } = useCodeEditorContext();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationIdsRef = useRef([]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) {
      return;
    }

    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const decorations = selectors.breakpoints.list.map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: "breakpoint-glyph",
        glyphMarginHoverMessage: { value: "Breakpoint" },
      },
    }));

    if (state.currentLine) {
      decorations.push({
        range: new monaco.Range(state.currentLine, 1, state.currentLine, 1),
        options: {
          isWholeLine: true,
          className: "active-line-highlight",
        },
      });
    }

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, decorations);
  }, [selectors.breakpoints.list, state.currentLine]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidFocusEditorText(() => setIsFocused(true));
    editor.onDidBlurEditorText(() => setIsFocused(false));

    editor.onDidChangeCursorPosition((event) => {
      setCursorPosition({
        line: event.position.lineNumber,
        column: event.position.column,
      });
    });

    editor.onMouseDown((event) => {
      const types = monaco.editor.MouseTargetType;
      const isGutterClick =
        event.target.type === types.GUTTER_GLYPH_MARGIN ||
        event.target.type === types.GUTTER_LINE_NUMBERS;
      if (!isGutterClick || !event.target.position) {
        return;
      }
      const line = event.target.position.lineNumber;
      actions.toggleBreakpoint(line);
    });
  };

  return (
    <section className="panel panel-editor">
      <header className="panel-header">
        <h2>Code Input</h2>
        <p>JavaScript subset with deterministic step execution</p>
      </header>
      <Editor
        language="javascript"
        value={state.code}
        onChange={(value) => actions.loadCode(value ?? "")}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        height="430px"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          glyphMargin: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
        }}
      />
    </section>
  );
}

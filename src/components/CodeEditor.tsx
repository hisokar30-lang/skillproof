'use client';

import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  height?: string;
  readOnly?: boolean;
}

export default function CodeEditor({
  code,
  setCode,
  language,
  height = '400px',
  readOnly = false
}: CodeEditorProps) {
  const [theme, setTheme] = useState('vs-dark');
  const editorRef = useRef<any>(null);

  const languageMap: Record<string, string> = {
    python: 'python',
    javascript: 'javascript',
    typescript: 'typescript',
  };

  const monacoLanguage = languageMap[language] || 'javascript';

  const defaultTemplates: Record<string, string> = {
    python: '# Read input\n# n = int(input())\n# arr = list(map(int, input().split()))\n\n# Write your solution\nprint("Hello, World!")',
    javascript: '// Read input\n// const readline = require(\"readline\");\n\n// Write your solution\nconsole.log(\"Hello, World!\");',
    typescript: '// Read input\n// const readline = require(\"readline\");\n\n// Write your solution\nconsole.log(\"Hello, World!\");',
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Code Editor</span>
          <span className="text-xs text-gray-400">{monacoLanguage}</span>
        </div>
        <button
          onClick={() => setTheme(theme === 'vs-dark' ? 'vs' : 'vs-dark')}
          className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition"
        >
          {theme === 'vs-dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      {/* Editor */}
      <Editor
        height={height}
        language={monacoLanguage}
        theme={theme}
        value={code}
        onChange={(value) => setCode(value || '')}
        onMount={handleEditorMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
          },
          fontSize: 14,
          lineNumbers: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
      />

      {/* Status Bar */}
      {!readOnly && (
        <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500 flex justify-between">
          <span>{code.length} characters</span>
          <span>{code.split('\n').length} lines</span>
        </div>
      )}
    </div>
  );
}

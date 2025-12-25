
import React, { useState } from 'react';
import { VirtualFile } from '../../types';

interface CodeEditorProps {
  jsEnabled: boolean;
  files: Record<string, VirtualFile>;
  onFileChange: (name: string, content: string) => void;
  onCreateFile?: (name: string, type: 'tendr' | 'javascript') => void;
  onHotReload?: (fileName: string) => void;
}

interface CompilerOutput {
    type: 'INFO' | 'ERROR' | 'BINARY';
    msg: string;
}

// --- TENDR LANGUAGE UTILS ---

type TokenType = 'KEYWORD' | 'IDENTIFIER' | 'NUMBER' | 'STRING' | 'SYMBOL' | 'UNKNOWN';

interface Token {
    type: TokenType;
    value: string;
    line: number;
}

const KEYWORDS = ['module', 'import', 'proc', 'struct', 'def', 'var', 'if', 'else', 'while', 'for', 'return', 'true', 'false'];
const TYPES = ['void', 'f32', 'i32', 'bool', 'string', 'Vec2', 'Vec3', 'Vec4', 'Mat4', 'Entity'];

const tokenize = (code: string): Token[] => {
    const tokens: Token[] = [];
    const lines = code.split('\n');

    lines.forEach((lineStr, lineIdx) => {
        let cursor = 0;
        const line = lineStr.trim();
        if (line.startsWith('#') || line.length === 0) return; // Comments/Empty

        // Simple Regex-based tokenizer
        const regex = /([a-zA-Z_]\w*)|(\d+(\.\d+)?)|(".*?")|(\:\:|\->|==|!=|<=|>=|&&|\|\||[\+\-\*\/\=\(\)\{\}\:\.\,])/g;
        let match;

        while ((match = regex.exec(lineStr)) !== null) {
            const val = match[0];
            let type: TokenType = 'UNKNOWN';

            if (KEYWORDS.includes(val)) type = 'KEYWORD';
            else if (TYPES.includes(val)) type = 'KEYWORD'; // Treat types as keywords for simplicity
            else if (/^[a-zA-Z_]\w*$/.test(val)) type = 'IDENTIFIER';
            else if (/^\d+(\.\d+)?$/.test(val)) type = 'NUMBER';
            else if (/^".*"$/.test(val)) type = 'STRING';
            else type = 'SYMBOL';

            tokens.push({ type, value: val, line: lineIdx + 1 });
        }
    });
    return tokens;
};

const CodeEditor: React.FC<CodeEditorProps> = ({ jsEnabled, files, onFileChange, onCreateFile, onHotReload }) => {
  const [activeFile, setActiveFile] = useState(Object.keys(files)[0]);
  const [compileStatus, setCompileStatus] = useState<'IDLE' | 'COMPILING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [outputLog, setOutputLog] = useState<CompilerOutput[]>([]);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // --- ADVANCED COMPILER SIMULATION ---
  const compileTendr = (sourceCode: string) => {
    setCompileStatus('COMPILING');
    setOutputLog([{ type: 'INFO', msg: 'Starting Titan Compiler (v2.6.1)...' }]);
    
    // Reset state
    const errors: string[] = [];
    const symbols: string[] = [];
    const variables: Record<string, string> = {}; // Name -> Type

    setTimeout(() => {
        // 1. Lexical Analysis
        const tokens = tokenize(sourceCode);
        if (tokens.length === 0) {
            setCompileStatus('ERROR');
            setOutputLog([{ type: 'ERROR', msg: 'File is empty or contains only comments.' }]);
            return;
        }

        // 2. Parsing & Semantic Analysis
        let i = 0;
        const peek = () => tokens[i];
        const consume = () => tokens[i++];
        const expect = (val: string, type?: TokenType) => {
            if (i >= tokens.length) {
                errors.push(`Unexpected end of file. Expected '${val}'.`);
                return false;
            }
            const t = tokens[i];
            if (t.value !== val || (type && t.type !== type)) {
                errors.push(`Line ${t.line}: Expected '${val}', found '${t.value}'.`);
                return false;
            }
            i++;
            return true;
        };

        // Module Declaration Check
        if (tokens[0].value !== 'module') errors.push("Line 1: File must start with 'module' declaration.");

        // Parsing Loop
        let braceCount = 0;
        
        while (i < tokens.length) {
            const t = consume();

            if (t.value === 'module') {
                if (peek().type === 'IDENTIFIER') {
                    symbols.push(`MODULE: ${consume().value}`);
                    // Optional :: sub_module
                    if(peek()?.value === '::') { consume(); consume(); } 
                } else errors.push(`Line ${t.line}: Invalid module name.`);
            }
            else if (t.value === 'import') {
                if (peek().type === 'IDENTIFIER') symbols.push(`IMPORT: ${consume().value}`);
            }
            else if (t.value === 'proc') {
                const name = consume();
                if (name.type !== 'IDENTIFIER') errors.push(`Line ${t.line}: Expected procedure name.`);
                if (!expect('::')) continue;
                if (!expect('(')) continue;
                // Skip args for demo
                while(i < tokens.length && tokens[i].value !== ')') i++;
                expect(')');
                if (!expect('->')) continue;
                const returnType = consume(); // Type
                symbols.push(`PROC: ${name.value} -> ${returnType.value}`);
                
                if (peek().value === '{') {
                    // Block started
                } else {
                     // Single line proc or error? Assuming block for now
                }
            }
            else if (t.value === 'def' || t.value === 'var') {
                const name = consume();
                if (name.type !== 'IDENTIFIER') errors.push(`Line ${t.line}: Expected variable name.`);
                
                // Check Redeclaration
                if (variables[name.value]) errors.push(`Line ${t.line}: Variable '${name.value}' already declared.`);
                
                if (expect(':')) {
                    const type = consume();
                    if (!TYPES.includes(type.value) && type.type !== 'IDENTIFIER') errors.push(`Line ${t.line}: Unknown type '${type.value}'.`);
                    variables[name.value] = type.value;
                    
                    if (peek().value === '=') {
                        consume();
                        // Value check (very basic)
                        const val = consume();
                        // Type matching (rudimentary)
                        if (type.value === 'f32' && val.type !== 'NUMBER') errors.push(`Line ${t.line}: Type mismatch. Expected f32.`);
                    }
                }
            }
            else if (t.value === 'if' || t.value === 'while') {
                 // Check parenthesis
                 // e.g. if (x > 10)
                 if (peek().value === '(') {
                     // good
                 } else {
                     errors.push(`Line ${t.line}: Expected '(' after control keyword.`);
                 }
            }
            else if (t.value === '{') braceCount++;
            else if (t.value === '}') braceCount--;
        }

        if (braceCount !== 0) errors.push(`Unbalanced braces. Count: ${braceCount}`);

        // Result Handling
        if (errors.length > 0) {
            setCompileStatus('ERROR');
            setOutputLog(prev => [
                ...prev, 
                ...errors.map(e => ({ type: 'ERROR' as const, msg: e })),
                { type: 'ERROR', msg: 'Build Failed.' }
            ]);
        } else {
            setCompileStatus('SUCCESS');
            const binarySize = Math.floor(sourceCode.length * 0.8 + 1024);
            setOutputLog(prev => [
                ...prev,
                { type: 'INFO', msg: 'Lexical Analysis: OK' },
                { type: 'INFO', msg: 'Abstract Syntax Tree: Generated' },
                { type: 'INFO', msg: `Semantic Check: ${Object.keys(variables).length} variables tracked.` },
                ...symbols.map(s => ({ type: 'BINARY' as const, msg: `generating symbol... ${s}` })),
                { type: 'BINARY', msg: `Writing binary... size: ${binarySize} bytes` },
                { type: 'INFO', msg: 'Build Successful.' }
            ]);
            
            // Trigger Hot Reload
            if (onHotReload) {
                onHotReload(activeFile);
            }
        }
    }, 800); 
  };

  return (
    <div className="w-full h-full bg-[#1e1e1e] flex flex-col font-mono text-sm overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-10 bg-[#252526] border-b border-black flex items-center px-4 justify-between select-none">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer transition-colors">
              <i className="fas fa-scroll text-[#ff9d5c]"></i>
              <span className="text-xs font-bold">{activeFile}</span>
           </div>
           <div className="h-4 w-px bg-white/10"></div>
           <button 
                onClick={() => compileTendr(files[activeFile].content)}
                className={`flex items-center gap-2 px-3 py-1 border rounded transition-all ${
                    compileStatus === 'COMPILING' ? 'bg-yellow-700/20 text-yellow-500 border-yellow-700/50' :
                    compileStatus === 'SUCCESS' ? 'bg-green-700/20 text-green-500 border-green-700/50' :
                    compileStatus === 'ERROR' ? 'bg-red-700/20 text-red-500 border-red-700/50' :
                    'bg-blue-700/20 text-blue-500 border-blue-700/50 hover:bg-blue-700/30'
                }`}
            >
              <i className={`fas ${compileStatus === 'COMPILING' ? 'fa-spinner fa-spin' : 'fa-play'} text-[10px]`}></i>
              <span className="text-[10px] font-black uppercase">
                  {compileStatus === 'COMPILING' ? 'Compiling...' : compileStatus === 'SUCCESS' ? 'Built' : compileStatus === 'ERROR' ? 'Failed' : 'Compile Titan'}
              </span>
           </button>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[10px] text-gray-500">Tendr Compiler v2.6.1.b</span>
           <div className={`w-2 h-2 rounded-full ${compileStatus === 'SUCCESS' ? 'bg-green-500' : compileStatus === 'ERROR' ? 'bg-red-500' : 'bg-indigo-500'} animate-pulse`}></div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Panel: Project Explorer */}
        <div className="w-64 bg-[#1e1e1e] border-r border-black flex flex-col">
           <div className="p-2 bg-[#252526] text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-black flex justify-between items-center">
               <span>MODULES</span>
               <button onClick={() => setShowNewFile(true)} className="hover:text-[#ff5e3a]"><i className="fas fa-plus"></i></button>
           </div>
           
           {showNewFile && (
               <div className="p-2 bg-[#252526] border-b border-white/10">
                   <input 
                    autoFocus 
                    placeholder="FileName..." 
                    className="w-full bg-black border border-white/10 text-xs p-1 text-white mb-1"
                    value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    onKeyDown={e => {
                        if(e.key === 'Enter' && onCreateFile) {
                            onCreateFile(newFileName, 'tendr');
                            setShowNewFile(false);
                            setNewFileName('');
                        }
                    }}
                   />
               </div>
           )}

           <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="text-[9px] font-bold text-gray-500 px-2 mb-2 uppercase">Virtual File System</div>
                 {Object.keys(files).map(fileName => (
                     <div 
                        key={fileName} 
                        onClick={() => setActiveFile(fileName)}
                        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-xs mb-1 transition-colors ${activeFile === fileName ? 'bg-[#ff5e3a]/10 text-[#ff5e3a]' : 'text-gray-400 hover:bg-white/5'}`}
                     >
                        <i className="fas fa-file-code"></i>
                        <span>{fileName}</span>
                     </div>
                 ))}
           </div>
        </div>

        {/* Center Panel: Editor */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
           <div className="flex-1 relative">
              <textarea
                className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm p-4 outline-none resize-none leading-relaxed custom-scrollbar selection:bg-[#ff5e3a]/30"
                value={files[activeFile].content}
                onChange={(e) => onFileChange(activeFile, e.target.value)}
                spellCheck={false}
              />
           </div>
           
           {/* Compilation Output Area */}
           <div className="h-40 bg-[#151515] border-t border-black p-2 font-mono text-xs overflow-y-auto">
               <div className="text-gray-500 mb-1 border-b border-white/5 pb-1">COMPILER OUTPUT / TERMINAL</div>
               {outputLog.length === 0 && <div className="text-gray-600 italic">Ready...</div>}
               {outputLog.map((log, i) => (
                   <div key={i} className={`${
                       log.type === 'ERROR' ? 'text-red-400' : 
                       log.type === 'BINARY' ? 'text-blue-400' : 
                       'text-gray-300'
                   }`}>
                       <span className="opacity-50 mr-2">[{log.type}]</span>
                       {log.msg}
                   </div>
               ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;

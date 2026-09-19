import React, { useState, useEffect, useRef } from 'react';
import { allModules, finalExamQuestions } from '../data/modules';
import { ModuleData, TestQuestion } from '../types';
import { Search, X, BookOpen, Award, ShieldCheck, ArrowRight, CornerDownLeft } from 'lucide-react';

interface SearchResultModule {
  type: 'module';
  module: ModuleData;
  matchedInvariants: string[];
  matchedTextSnippet?: string;
}

interface SearchResultTest {
  type: 'test';
  moduleCode: string;
  moduleId: string;
  moduleTitle: string;
  test: TestQuestion;
  matchedInvariant?: string;
  matchedSnippet?: string;
}

interface SearchBarProps {
  onSelectModule: (moduleId: string) => void;
  onSelectTest: (moduleId: string, testId: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectModule, onSelectTest }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Shortcut (Ctrl+K or Cmd+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate search matches
  const normalizedQuery = query.trim().toLowerCase();

  const moduleResults: SearchResultModule[] = [];
  const testResults: SearchResultTest[] = [];

  if (normalizedQuery.length > 0) {
    // 1. Search Modules
    allModules.forEach((m) => {
      const matchedInvariants: string[] = [];
      let matchedTextSnippet = '';

      // Check invariants
      m.invariants.forEach((inv) => {
        if (inv.toLowerCase().includes(normalizedQuery)) {
          matchedInvariants.push(inv);
        }
      });

      // Check title, code, summary
      const titleMatch = m.title.toLowerCase().includes(normalizedQuery);
      const codeMatch = m.code.toLowerCase().includes(normalizedQuery);
      const summaryMatch = m.summary.toLowerCase().includes(normalizedQuery);

      if (titleMatch || codeMatch || summaryMatch || matchedInvariants.length > 0) {
        if (summaryMatch) {
          matchedTextSnippet = m.summary;
        }
        moduleResults.push({
          type: 'module',
          module: m,
          matchedInvariants,
          matchedTextSnippet: matchedTextSnippet || m.summary
        });
      }

      // 2. Search Test Questions inside module
      m.testSuite.forEach((q) => {
        let matchedInvariant = '';
        let matchedSnippet = '';

        const inTitle = q.title.toLowerCase().includes(normalizedQuery);
        const inExpectedInvariant = q.expectedInvariant.toLowerCase().includes(normalizedQuery);
        const inSolution = q.detailedInvariantSolution.toLowerCase().includes(normalizedQuery);
        const inScenario = q.scenario.toLowerCase().includes(normalizedQuery);
        const inProblem = q.problemStatement.toLowerCase().includes(normalizedQuery);
        const inOptions = q.options?.some(
          (o) => o.text.toLowerCase().includes(normalizedQuery) || o.explanation.toLowerCase().includes(normalizedQuery)
        );

        if (inTitle || inExpectedInvariant || inSolution || inScenario || inProblem || inOptions) {
          if (inExpectedInvariant) {
            matchedInvariant = q.expectedInvariant;
          } else if (inSolution) {
            matchedSnippet = q.detailedInvariantSolution;
          } else if (inScenario) {
            matchedSnippet = q.scenario;
          } else {
            matchedSnippet = q.problemStatement;
          }

          testResults.push({
            type: 'test',
            moduleCode: m.code,
            moduleId: m.id,
            moduleTitle: m.title,
            test: q,
            matchedInvariant,
            matchedSnippet
          });
        }
      });
    });

    // 3. Search Final Exam Questions (Capstone)
    finalExamQuestions.forEach((q) => {
      let matchedInvariant = '';
      let matchedSnippet = '';

      const inTitle = q.title.toLowerCase().includes(normalizedQuery);
      const inExpectedInvariant = q.expectedInvariant.toLowerCase().includes(normalizedQuery);
      const inSolution = q.detailedInvariantSolution.toLowerCase().includes(normalizedQuery);
      const inScenario = q.scenario.toLowerCase().includes(normalizedQuery);
      const inProblem = q.problemStatement.toLowerCase().includes(normalizedQuery);
      const inOptions = q.options?.some(
        (o) => o.text.toLowerCase().includes(normalizedQuery) || o.explanation.toLowerCase().includes(normalizedQuery)
      );

      if (inTitle || inExpectedInvariant || inSolution || inScenario || inProblem || inOptions) {
        if (inExpectedInvariant) {
          matchedInvariant = q.expectedInvariant;
        } else if (inSolution) {
          matchedSnippet = q.detailedInvariantSolution;
        } else if (inScenario) {
          matchedSnippet = q.scenario;
        } else {
          matchedSnippet = q.problemStatement;
        }

        testResults.push({
          type: 'test',
          moduleCode: 'CAPSTONE',
          moduleId: 'final-exam',
          moduleTitle: 'Exame Final Integrado CS-901',
          test: q,
          matchedInvariant,
          matchedSnippet
        });
      }
    });
  }

  // Keyboard navigation within search results
  const allResultsList: Array<
    | { type: 'module'; moduleId: string }
    | { type: 'test'; moduleId: string; testId: string }
  > = [
    ...moduleResults.map((m) => ({ type: 'module' as const, moduleId: m.module.id })),
    ...testResults.map((t) => ({ type: 'test' as const, moduleId: t.moduleId, testId: t.test.id }))
  ];

  const totalResultsCount = allResultsList.length;

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || allResultsList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allResultsList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResultsList.length) % allResultsList.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = allResultsList[selectedIndex];
      if (item) {
        if (item.type === 'module') {
          handleModuleClick(item.moduleId);
        } else {
          handleTestClick(item.moduleId, item.testId);
        }
      }
    }
  };

  const handleModuleClick = (moduleId: string) => {
    onSelectModule(moduleId);
    setIsOpen(false);
  };

  const handleTestClick = (moduleId: string, testId: string) => {
    onSelectTest(moduleId, testId);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string, queryStr: string) => {
    if (!queryStr) return text;
    const parts = text.split(new RegExp(`(${queryStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === queryStr.toLowerCase() ? (
        <mark key={i} className="bg-emerald-500/30 text-emerald-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative flex-1 max-w-md w-full">
      {/* Search Bar Input */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar módulos, testes ou invariantes... (Ctrl+K)"
          className="w-full bg-slate-950/80 border border-slate-700/80 text-xs text-slate-100 pl-10 pr-16 py-2 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner placeholder:text-slate-500"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded shadow-sm">
              Ctrl K
            </kbd>
          )}
        </div>
      </div>

      {/* Search Results Dropdown Overlay */}
      {isOpen && normalizedQuery.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[75vh] flex flex-col font-sans text-xs divide-y divide-slate-800"
        >
          {/* Header count */}
          <div className="px-4 py-2.5 bg-slate-950/90 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {totalResultsCount > 0 ? (
                <>
                  <strong className="text-emerald-400">{totalResultsCount}</strong> resultado(s) encontrado(s)
                </>
              ) : (
                'Nenhum resultado encontrado'
              )}
            </span>
            <span className="text-[10px] text-slate-500">Pressione ESC para fechar</span>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto flex-1 p-2 space-y-4">
            {totalResultsCount === 0 && (
              <div className="p-6 text-center text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Nenhum módulo ou invariante com "{query}"</p>
                <p className="text-[11px] text-slate-500">Tente buscar por termos como: SAGA, WAL, Outbox, RAG, AST, MCP, Leiden, DPO.</p>
              </div>
            )}

            {/* Modules Group */}
            {moduleResults.length > 0 && (
              <div className="space-y-1.5">
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Módulos ({moduleResults.length})
                </div>

                <div className="space-y-1">
                  {moduleResults.map(({ module, matchedInvariants, matchedTextSnippet }, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={module.id}
                        onClick={() => handleModuleClick(module.id)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full text-left p-2.5 rounded-lg border transition group flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-slate-800 border-emerald-500/80 ring-1 ring-emerald-500/50'
                            : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800/80 hover:border-emerald-600/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-200 group-hover:text-emerald-300 transition flex items-center gap-2">
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono px-1.5 py-0.5 rounded">
                              {module.code}
                            </span>
                            {highlightMatch(module.title, normalizedQuery)}
                          </span>
                          <CornerDownLeft className={`w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition ${isSelected ? 'opacity-100 text-emerald-400' : 'opacity-0 group-hover:opacity-100'}`} />
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {highlightMatch(matchedTextSnippet || module.summary, normalizedQuery)}
                        </p>

                        {matchedInvariants.length > 0 && (
                          <div className="mt-1 bg-slate-900 p-1.5 rounded border border-slate-800 text-[10px] text-amber-300/90 font-mono flex items-start gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">
                              Invariante: {highlightMatch(matchedInvariants[0], normalizedQuery)}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Test Questions & Invariants Group */}
            {testResults.length > 0 && (
              <div className="space-y-1.5">
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Testes & Invariantes de Avaliação ({testResults.length})
                </div>

                <div className="space-y-1">
                  {testResults.map(({ moduleId, moduleCode, test, matchedInvariant, matchedSnippet }, index) => {
                    const idx = moduleResults.length + index;
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={`${moduleId}-${test.id}`}
                        onClick={() => handleTestClick(moduleId, test.id)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full text-left p-2.5 rounded-lg border transition group flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-slate-800 border-amber-500/80 ring-1 ring-amber-500/50'
                            : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800/80 hover:border-amber-600/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0">
                              {moduleCode} | Q{test.number}
                            </span>
                            <span className="font-bold text-slate-200 group-hover:text-amber-200 transition truncate">
                              {highlightMatch(test.title, normalizedQuery)}
                            </span>
                          </div>
                          <ArrowRight className={`w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition shrink-0 ${isSelected ? 'opacity-100 text-amber-400' : 'opacity-0 group-hover:opacity-100'}`} />
                        </div>

                        {matchedInvariant ? (
                          <div className="bg-amber-950/30 border border-amber-800/40 p-2 rounded text-[11px] font-mono text-amber-200/90 leading-tight">
                            <span className="font-bold text-amber-400 block text-[9px] uppercase tracking-widest mb-0.5">
                              Invariante da Questão:
                            </span>
                            {highlightMatch(matchedInvariant, normalizedQuery)}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {highlightMatch(matchedSnippet || test.problemStatement, normalizedQuery)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

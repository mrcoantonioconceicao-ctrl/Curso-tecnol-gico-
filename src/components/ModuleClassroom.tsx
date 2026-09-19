import React, { useState } from 'react';
import { ModuleData } from '../types';
import { KaTeXMath } from './KaTeXMath';
import { TestEngine } from './TestEngine';

// Simulators
import { MCPSandboxUI } from './simulators/MCPSandbox';
import { GraphRAGSimulatorUI } from './simulators/GraphRAGSimulator';
import { LoRACalculatorUI } from './simulators/LoRACalculator';
import { ASTComplexityAnalyzerUI } from './simulators/ASTComplexityAnalyzer';
import { BPMNPetriNetSimulatorUI } from './simulators/BPMNPetriNetSimulator';
import { DDDOutboxStreamUI } from './simulators/DDDOutboxStream';
import { CapstoneOrchestratorUI } from './simulators/CapstoneOrchestrator';

import {
  ArrowLeft,
  BookOpen,
  FileCode,
  Activity,
  Award,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  ChevronRight
} from 'lucide-react';

interface ModuleClassroomProps {
  module: ModuleData;
  initialSubView?: 'theory' | 'code' | 'simulator' | 'tests';
  isCompleted: boolean;
  scoreData?: { score: number; total: number };
  onBackToDashboard: () => void;
  onToggleComplete: () => void;
  onRecordScore: (score: number, total: number) => void;
}

export const ModuleClassroom: React.FC<ModuleClassroomProps> = ({
  module,
  initialSubView = 'theory',
  isCompleted,
  scoreData,
  onBackToDashboard,
  onToggleComplete,
  onRecordScore
}) => {
  const [activeSubView, setActiveSubView] = useState<'theory' | 'code' | 'simulator' | 'tests'>(
    initialSubView
  );
  const [copiedInvariants, setCopiedInvariants] = useState(false);

  const handleCopyInvariants = () => {
    const text = module.invariants.map((i, idx) => `${idx + 1}. ${i}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedInvariants(true);
    setTimeout(() => setCopiedInvariants(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <button
            onClick={onBackToDashboard}
            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Painel do Aluno (Início)
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-400 truncate max-w-[150px] sm:max-w-xs">{module.block}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {module.code}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {scoreData && (
            <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono px-2.5 py-1 rounded-lg">
              Nota: {scoreData.score}/{scoreData.total} ({Math.round((scoreData.score / scoreData.total) * 100)}%)
            </span>
          )}

          <button
            onClick={onToggleComplete}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              isCompleted
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-400' : 'text-slate-500'}`} />
            {isCompleted ? 'Módulo Concluído' : 'Marcar como Concluído'}
          </button>
        </div>
      </div>

      {/* Classroom Module Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 px-3 py-1 rounded-md border border-emerald-800/60">
            {module.block} | {module.code}
          </span>

          <button
            onClick={handleCopyInvariants}
            className="text-xs text-slate-400 hover:text-slate-200 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1.5 transition font-mono"
          >
            {copiedInvariants ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Invariantes Copiados!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" /> Copiar Invariantes
              </>
            )}
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">
          {module.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-4xl">
          {module.summary}
        </p>

        {/* Classroom Sub-Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveSubView('theory')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
              activeSubView === 'theory'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Aula 1: Teoria & Matriz Analítica
          </button>

          <button
            onClick={() => setActiveSubView('code')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
              activeSubView === 'code'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileCode className="w-4 h-4" /> Aula 2: Código Zero-Mock
          </button>

          <button
            onClick={() => setActiveSubView('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
              activeSubView === 'simulator'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" /> Laboratório / Simulador
          </button>

          {module.testSuite.length > 0 && (
            <button
              onClick={() => setActiveSubView('tests')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
                activeSubView === 'tests'
                  ? 'bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Award className="w-4 h-4" /> Avaliação: 10 Testes MIT
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Theory & Analytical Matrix */}
      {activeSubView === 'theory' && (
        <div className="space-y-6">
          {/* Analytical Trade-offs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
              <Zap className="w-4 h-4 text-emerald-400" /> Matriz Analítica de Trade-offs e Limites Determinísticos
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Domínio</th>
                    <th className="py-2.5 px-3">Limite Determinístico</th>
                    <th className="py-2.5 px-3">Trade-off Latência vs Consistência</th>
                    <th className="py-2.5 px-3">Invariante de Segurança</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {module.analyticalMatrix.map((item, idx) => (
                    <tr key={idx} className="text-slate-300 hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-semibold text-emerald-400">{item.domain}</td>
                      <td className="py-3 px-3">{item.deterministicBound}</td>
                      <td className="py-3 px-3 text-slate-400">{item.latencyVsConsistency}</td>
                      <td className="py-3 px-3 text-amber-300/90 font-mono text-[11px]">{item.securityInvariant}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Theory Sections */}
          <div className="space-y-6">
            {module.theorySections.map((sec, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-3">
                <h3 className="text-base font-bold text-slate-100">{sec.title}</h3>
                {sec.subtitle && <p className="text-xs text-emerald-400 font-mono">{sec.subtitle}</p>}

                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                  {sec.content}
                </div>

                {sec.latexFormula && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono my-2 overflow-x-auto">
                    <KaTeXMath math={sec.latexFormula} displayMode={true} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Invariants Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Invariantes Formais Regulatórios do Módulo
            </h3>
            <ul className="space-y-2">
              {module.invariants.map((inv, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{inv}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Reference Implementation Code */}
      {activeSubView === 'code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">
                {module.referenceImplementation.filename}
              </h3>
              <p className="text-xs text-slate-400">
                {module.referenceImplementation.description}
              </p>
            </div>
            <span className="bg-slate-950 text-emerald-400 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded">
              {module.referenceImplementation.language.toUpperCase()}
            </span>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed shadow-inner">
            <code>{module.referenceImplementation.code}</code>
          </pre>
        </div>
      )}

      {/* Tab 3: Interactive Simulator */}
      {activeSubView === 'simulator' && (
        <div>
          {module.id === 'm1' && <MCPSandboxUI />}
          {module.id === 'm2' && <GraphRAGSimulatorUI />}
          {module.id === 'm3' && <LoRACalculatorUI />}
          {module.id === 'm4-m5' && <ASTComplexityAnalyzerUI />}
          {module.id === 'm6' && <BPMNPetriNetSimulatorUI />}
          {module.id === 'm7-m8' && <DDDOutboxStreamUI />}
          {module.id === 'capstone' && <CapstoneOrchestratorUI />}
        </div>
      )}

      {/* Tab 4: 10 MIT Test Suite */}
      {activeSubView === 'tests' && (
        <TestEngine
          questions={module.testSuite}
          moduleTitle={module.title}
          onQuizSubmitted={(score, total) => {
            onRecordScore(score, total);
            if (score / total >= 0.7) {
              onToggleComplete();
            }
          }}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { ModuleData } from '../types';
import {
  BookOpen,
  CheckCircle2,
  Award,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
  RotateCcw,
  Play
} from 'lucide-react';

interface StudentDashboardProps {
  modules: ModuleData[];
  completedModuleIds: string[];
  quizScores: Record<string, { score: number; total: number }>;
  lastVisitedModuleId: string | null;
  onOpenModule: (moduleId: string, subView?: 'theory' | 'code' | 'simulator' | 'tests') => void;
  onOpenCapstone: () => void;
  onToggleCompleteModule: (moduleId: string) => void;
  onOpenCertificateModal: () => void;
  onResetProgress: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  modules,
  completedModuleIds,
  quizScores,
  lastVisitedModuleId,
  onOpenModule,
  onOpenCapstone,
  onToggleCompleteModule,
  onOpenCertificateModal,
  onResetProgress
}) => {
  const [selectedBlock, setSelectedBlock] = useState<string>('all');

  // Filter modules by block
  const filteredModules = modules.filter((m) => {
    if (m.id === 'capstone') return false; // Handled separately in dedicated capstone card
    if (selectedBlock === 'all') return true;
    if (selectedBlock === 'bloco-1') return m.block.includes('Bloco I');
    if (selectedBlock === 'bloco-2') return m.block.includes('Bloco II');
    if (selectedBlock === 'bloco-3') return m.block.includes('Bloco III');
    return true;
  });

  // Calculate overall student metrics
  const standardModulesCount = modules.filter((m) => m.id !== 'capstone').length;
  const completedCount = completedModuleIds.filter((id) => id !== 'capstone').length;
  const overallProgressPercentage = Math.round((completedCount / standardModulesCount) * 100);

  const quizzesAttemptedCount = Object.keys(quizScores).length;

  let totalCorrectAnswers = 0;
  let totalQuestionsAttempted = 0;
  Object.values(quizScores).forEach((qs) => {
    totalCorrectAnswers += qs.score;
    totalQuestionsAttempted += qs.total;
  });

  const averageAccuracy =
    totalQuestionsAttempted > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAttempted) * 100) : 0;

  const totalInvariantsMastered = modules.reduce((acc, m) => {
    if (completedModuleIds.includes(m.id)) {
      return acc + m.invariants.length;
    }
    return acc;
  }, 0);

  const lastVisitedModule = modules.find((m) => m.id === lastVisitedModuleId) || modules[0];

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Hero Welcome Banner / Student AVA Portal */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-mono font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AVA / Portal EAD de Engenharia MIT-Grade
              </span>
              <span className="bg-slate-800 text-slate-300 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-slate-700">
                Curso CS-901
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              Ambiente Virtual de Aprendizagem (AVA)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore o currículo avançado de Engenharia de Software, Protocolos de IA (MCP/GraphRAG/LoRA), Análise AST, Orquestração SAGA e Consistência Distribuída. Cada módulo possui sala de aula individual, simulação e avaliação.
            </p>

            {/* Quick Resume Button */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenModule(lastVisitedModule.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-slate-950" /> Continuar Estudos ({lastVisitedModule.code}: {lastVisitedModule.title.split('—')[0]})
              </button>

              {overallProgressPercentage >= 50 && (
                <button
                  onClick={onOpenCertificateModal}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-amber-400" /> Ver Certificado Parcial
                </button>
              )}
            </div>
          </div>

          {/* Student Progress Widget */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 min-w-[280px] space-y-4 shadow-inner shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase">Progresso do Curso</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{overallProgressPercentage}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                style={{ width: `${overallProgressPercentage}%` }}
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Módulos Concluídos</span>
                <strong className="text-slate-200 text-sm">{completedCount} / {standardModulesCount}</strong>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Média de Acertos</span>
                <strong className="text-emerald-400 text-sm">{averageAccuracy}%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Student Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Aulas do Currículo</span>
            <strong className="text-base text-slate-100">{standardModulesCount} Módulos</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-teal-950 text-teal-400 border border-teal-800/80 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Concluídos pelo Aluno</span>
            <strong className="text-base text-teal-300">{completedCount} de {standardModulesCount}</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-950 text-amber-400 border border-amber-800/80 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Avaliações Feitas</span>
            <strong className="text-base text-amber-300">{quizzesAttemptedCount} Testes</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-purple-950 text-purple-400 border border-purple-800/80 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Invariantes Dominados</span>
            <strong className="text-base text-purple-300">{totalInvariantsMastered} Regras</strong>
          </div>
        </div>
      </div>

      {/* Course Track Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-mono text-slate-400 font-bold uppercase mr-2 hidden sm:inline">
            Trilhas:
          </span>

          <button
            onClick={() => setSelectedBlock('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              selectedBlock === 'all'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Todos os Módulos
          </button>

          <button
            onClick={() => setSelectedBlock('bloco-1')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              selectedBlock === 'bloco-1'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Bloco I: IA & Protocolos (M1-M3)
          </button>

          <button
            onClick={() => setSelectedBlock('bloco-2')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              selectedBlock === 'bloco-2'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Bloco II: Código & Processos (M4-M6)
          </button>

          <button
            onClick={() => setSelectedBlock('bloco-3')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              selectedBlock === 'bloco-3'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Bloco III: Arquitetura & Domínio (M7-M8)
          </button>
        </div>

        <button
          onClick={onResetProgress}
          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 font-mono transition"
          title="Reiniciar progresso salvo do aluno"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reiniciar Progresso
        </button>
      </div>

      {/* Course Modules Cards Grid (EAD Student Portal) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => {
          const isCompleted = completedModuleIds.includes(module.id);
          const scoreData = quizScores[module.id];

          return (
            <div
              key={module.id}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition hover:shadow-xl group relative overflow-hidden ${
                isCompleted
                  ? 'border-emerald-600/60 shadow-emerald-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header & Badges */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md">
                    {module.code}
                  </span>

                  <div className="flex items-center gap-2">
                    {scoreData && (
                      <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                        Nota: {scoreData.score}/{scoreData.total} ({Math.round((scoreData.score / scoreData.total) * 100)}%)
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Concluído
                        </>
                      ) : (
                        'Pendente'
                      )}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition line-clamp-2">
                  {module.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 font-sans">
                  {module.summary}
                </p>

                {/* Key Invariants Preview Pills */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                    Invariantes Chave ({module.invariants.length}):
                  </span>
                  <div className="space-y-1">
                    {module.invariants.slice(0, 2).map((inv, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] font-mono text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800/80 truncate"
                        title={inv}
                      >
                        • {inv}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-5 mt-4 border-t border-slate-800/80 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Est. 2h 30m
                  </span>
                  <span>{module.testSuite.length} Questões MIT</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenModule(module.id, 'theory')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Sala de Aula
                  </button>

                  <button
                    onClick={() => onOpenModule(module.id, 'tests')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-medium text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Avaliação
                  </button>
                </div>

                {/* Mark completed toggle */}
                <button
                  onClick={() => onToggleCompleteModule(module.id)}
                  className="text-[10px] font-mono text-slate-500 hover:text-emerald-400 text-center py-1 transition flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className={`w-3 h-3 ${isCompleted ? 'text-emerald-400' : 'text-slate-600'}`} />
                  {isCompleted ? 'Desmarcar Conclusão' : 'Marcar como Lido/Estudado'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Capstone Final Graduation Exam Highlight Box */}
      <div className="relative bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden mt-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-amber-400" /> Prova Final de Graduação EAD
            </span>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Exame Capstone Integrado CS-901
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              20 Questões Integradas de Nível MIT cobrindo falhas cruzadas entre SAGA, DDD, AST, MCP e GraphRAG. Exige 70%+ de aproveitamento para emissão do Certificado Oficial de Engenheiro de Software.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={onOpenCapstone}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
            >
              <GraduationCap className="w-5 h-5" /> Iniciar Prova Final (20 Qs)
            </button>

            <button
              onClick={onOpenCertificateModal}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium text-xs py-2 px-4 rounded-xl transition text-center"
            >
              Visualizar Certificado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

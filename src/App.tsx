import React, { useState, useEffect } from 'react';
import { allModules, finalExamQuestions } from './data/modules';
import { ModuleData } from './types';
import { SearchBar } from './components/SearchBar';
import { StudentDashboard } from './components/StudentDashboard';
import { ModuleClassroom } from './components/ModuleClassroom';
import { TestEngine } from './components/TestEngine';
import { StudentCertificateModal } from './components/StudentCertificateModal';

import {
  ShieldCheck,
  GraduationCap,
  ArrowLeft,
  Award,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Home
} from 'lucide-react';

export function App() {
  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<'dashboard' | 'module' | 'capstone'>('dashboard');
  const [activeModuleId, setActiveModuleId] = useState<string>('m1');
  const [activeSubView, setActiveSubView] = useState<'theory' | 'code' | 'simulator' | 'tests'>('theory');

  // Student Persistence State (localStorage)
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cs901_completed_modules');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [quizScores, setQuizScores] = useState<Record<string, { score: number; total: number }>>(() => {
    try {
      const saved = localStorage.getItem('cs901_quiz_scores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [lastVisitedModuleId, setLastVisitedModuleId] = useState<string | null>(() => {
    return localStorage.getItem('cs901_last_module') || 'm1';
  });

  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cs901_completed_modules', JSON.stringify(completedModuleIds));
    } catch (e) {
      console.error('Failed to save completed modules', e);
    }
  }, [completedModuleIds]);

  useEffect(() => {
    try {
      localStorage.setItem('cs901_quiz_scores', JSON.stringify(quizScores));
    } catch (e) {
      console.error('Failed to save quiz scores', e);
    }
  }, [quizScores]);

  useEffect(() => {
    if (activeModuleId) {
      localStorage.setItem('cs901_last_module', activeModuleId);
      setLastVisitedModuleId(activeModuleId);
    }
  }, [activeModuleId]);

  // Handlers
  const handleToggleCompleteModule = (moduleId: string) => {
    setCompletedModuleIds((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleRecordScore = (moduleId: string, score: number, total: number) => {
    setQuizScores((prev) => ({
      ...prev,
      [moduleId]: { score, total }
    }));
  };

  const handleSelectModule = (
    moduleId: string,
    subView: 'theory' | 'code' | 'simulator' | 'tests' = 'theory'
  ) => {
    if (moduleId === 'final-exam' || moduleId === 'capstone-exam') {
      setCurrentRoute('capstone');
    } else {
      setActiveModuleId(moduleId);
      setActiveSubView(subView);
      setCurrentRoute('module');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTest = (moduleId: string, testId: string) => {
    if (moduleId === 'final-exam') {
      setCurrentRoute('capstone');
    } else {
      setActiveModuleId(moduleId);
      setActiveSubView('tests');
      setCurrentRoute('module');
    }

    setTimeout(() => {
      const el = document.getElementById(`question-${testId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-amber-400');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-amber-400');
        }, 2500);
      }
    }, 200);
  };

  const handleResetProgress = () => {
    if (window.confirm('Tem certeza de que deseja reiniciar o progresso e notas do estudante?')) {
      setCompletedModuleIds([]);
      setQuizScores({});
      localStorage.removeItem('cs901_completed_modules');
      localStorage.removeItem('cs901_quiz_scores');
    }
  };

  const activeModule = allModules.find((m) => m.id === activeModuleId) || allModules[0];

  // Calculate stats for certificate
  let totalScorePoints = 0;
  let totalMaxPoints = 0;
  Object.values(quizScores).forEach((s) => {
    totalScorePoints += s.score;
    totalMaxPoints += s.total;
  });
  const overallScorePercentage =
    totalMaxPoints > 0 ? Math.round((totalScorePoints / totalMaxPoints) * 100) : 100;

  const totalInvariantsMastered = allModules.reduce((acc, m) => {
    if (completedModuleIds.includes(m.id)) {
      return acc + m.invariants.length;
    }
    return acc;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* AVA / EAD Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentRoute('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold font-mono text-slate-950 text-base shadow-lg shadow-emerald-500/10">
              AVA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                  Portal EAD — CS-901 <Sparkles className="w-4 h-4 text-emerald-400" />
                </h1>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  Zero-Mock
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ambiente Virtual de Aprendizagem & Engenharia de Software MIT-Grade
              </p>
            </div>
          </div>

          {/* Global Search Bar */}
          <SearchBar onSelectModule={handleSelectModule} onSelectTest={handleSelectTest} />

          {/* Navigation Controls & Certificate CTA */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {currentRoute !== 'dashboard' && (
              <button
                onClick={() => setCurrentRoute('dashboard')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              >
                <Home className="w-4 h-4 text-emerald-400" /> Início / Dashboard
              </button>
            )}

            <button
              onClick={() => setShowCertificateModal(true)}
              className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition font-bold"
            >
              <Award className="w-4 h-4 text-emerald-400" /> Certificado EAD
            </button>
          </div>
        </div>
      </header>

      {/* Main EAD App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {currentRoute === 'dashboard' && (
          <StudentDashboard
            modules={allModules}
            completedModuleIds={completedModuleIds}
            quizScores={quizScores}
            lastVisitedModuleId={lastVisitedModuleId}
            onOpenModule={(id, sub) => handleSelectModule(id, sub)}
            onOpenCapstone={() => setCurrentRoute('capstone')}
            onToggleCompleteModule={handleToggleCompleteModule}
            onOpenCertificateModal={() => setShowCertificateModal(true)}
            onResetProgress={handleResetProgress}
          />
        )}

        {currentRoute === 'module' && activeModule && (
          <ModuleClassroom
            module={activeModule}
            initialSubView={activeSubView}
            isCompleted={completedModuleIds.includes(activeModule.id)}
            scoreData={quizScores[activeModule.id]}
            onBackToDashboard={() => setCurrentRoute('dashboard')}
            onToggleComplete={() => handleToggleCompleteModule(activeModule.id)}
            onRecordScore={(s, t) => handleRecordScore(activeModule.id, s, t)}
          />
        )}

        {currentRoute === 'capstone' && (
          <div className="space-y-6 font-sans pb-12">
            {/* Top Breadcrumb */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono">
              <button
                onClick={() => setCurrentRoute('dashboard')}
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Painel do Aluno (Início)
              </button>
              <span className="text-amber-300 font-bold bg-amber-950 px-2.5 py-1 rounded border border-amber-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-400" /> Exame Final de Graduação (Capstone)
              </span>
            </div>

            {/* Capstone Exam Engine */}
            <TestEngine
              questions={finalExamQuestions}
              moduleTitle="Exame Final Integrado CS-901 (Graduação EAD)"
              onQuizSubmitted={(score, total) => {
                handleRecordScore('capstone', score, total);
                if (score / total >= 0.7) {
                  handleToggleCompleteModule('capstone');
                }
              }}
            />
          </div>
        )}
      </main>

      {/* Student Graduation Certificate Modal */}
      {showCertificateModal && (
        <StudentCertificateModal
          totalScore={overallScorePercentage}
          unlockedInvariantsCount={totalInvariantsMastered}
          onClose={() => setShowCertificateModal(false)}
        />
      )}
    </div>
  );
}

export default App;

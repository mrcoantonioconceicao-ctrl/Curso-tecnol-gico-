import React, { useState } from 'react';
import { TestQuestion, QuizAttempt } from '../types';
import { KaTeXMath } from './KaTeXMath';
import { CheckCircle2, XCircle, Award, HelpCircle, ArrowRight, ShieldAlert } from 'lucide-react';

interface TestEngineProps {
  questions: TestQuestion[];
  moduleTitle: string;
  onQuizSubmitted?: (score: number, total: number) => void;
}

export const TestEngine: React.FC<TestEngineProps> = ({
  questions,
  moduleTitle,
  onQuizSubmitted
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submitted[questionId]) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    if (submitted[questionId]) return;
    setTextAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitQuestion = (questionId: string) => {
    const updatedSubmitted = { ...submitted, [questionId]: true };
    setSubmitted(updatedSubmitted);

    if (onQuizSubmitted) {
      let correct = 0;
      questions.forEach((q) => {
        if (updatedSubmitted[q.id]) {
          const selectedOptId = selectedAnswers[q.id];
          const correctOpt = q.options?.find((o) => o.isCorrect);
          if (correctOpt && selectedOptId === correctOpt.id) {
            correct++;
          }
        }
      });
      onQuizSubmitted(correct, questions.length);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      if (submitted[q.id]) {
        const selectedOptId = selectedAnswers[q.id];
        const correctOpt = q.options?.find(o => o.isCorrect);
        if (correctOpt && selectedOptId === correctOpt.id) {
          correct++;
        }
      }
    });
    return { correct, total: questions.length };
  };

  const score = calculateScore();

  return (
    <div className="space-y-8 font-sans">
      {/* Test Suite Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-widest mb-1">
            MIT-Grade High-Rigor Evaluation Suite
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            {questions.length} Testes de Alta Exigência — {moduleTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gabarito comentado fundamentado estritamente em invariantes de sistema matemáticas/lógicas.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 px-5 py-3 rounded-lg border border-slate-800">
          <Award className="w-8 h-8 text-amber-400 shrink-0" />
          <div>
            <div className="text-xs text-slate-400 font-semibold">Pontuação Obtida:</div>
            <div className="text-lg font-bold font-mono text-emerald-400">
              {score.correct} / {score.total} <span className="text-xs text-slate-500 font-normal">({Math.round((score.correct / Math.max(score.total, 1)) * 100)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, qIndex) => {
          const isSubmitted = submitted[q.id];
          const selectedOptionId = selectedAnswers[q.id];
          const selectedOption = q.options?.find(o => o.id === selectedOptionId);
          const correctOption = q.options?.find(o => o.isCorrect);
          const isCorrect = selectedOption?.isCorrect;

          return (
            <div
              key={q.id}
              id={`question-${q.id}`}
              className={`bg-slate-900 border rounded-xl p-6 transition shadow-lg ${
                isSubmitted
                  ? isCorrect
                    ? 'border-emerald-700/60 bg-emerald-950/10'
                    : 'border-rose-700/60 bg-rose-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 mb-4 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                    Q{q.number}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">
                    {q.title}
                  </h3>
                </div>

                {isSubmitted && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 shrink-0 ${
                    isCorrect
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {isCorrect ? 'RESPOSTA CORRETA' : 'RESPOSTA INCORRETA'}
                  </span>
                )}
              </div>

              {/* Scenario & Problem */}
              <div className="space-y-3 mb-5">
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-mono">
                  <span className="text-amber-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">Cenário do Problema:</span>
                  {q.scenario}
                </div>

                <p className="text-xs font-semibold text-slate-200 leading-normal">
                  {q.problemStatement}
                </p>
              </div>

              {/* Options list if multiple choice */}
              {q.options && q.options.length > 0 && (
                <div className="space-y-2.5 mb-5">
                  {q.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    let optionStyle = 'border-slate-800 hover:border-slate-700 text-slate-300 bg-slate-950/60';

                    if (isSubmitted) {
                      if (opt.isCorrect) {
                        optionStyle = 'border-emerald-600 bg-emerald-950/50 text-emerald-200 font-medium';
                      } else if (isSelected && !opt.isCorrect) {
                        optionStyle = 'border-rose-600 bg-rose-950/50 text-rose-200';
                      } else {
                        optionStyle = 'border-slate-800 text-slate-500 opacity-60';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-emerald-500 bg-emerald-950/30 text-emerald-300 font-medium';
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        disabled={isSubmitted}
                        className={`w-full text-left p-3.5 rounded-lg border text-xs transition flex items-start gap-3 ${optionStyle}`}
                      >
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5 ${
                          isSelected ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold' : 'border-slate-700 text-slate-400'
                        }`}>
                          {opt.id.slice(-1).toUpperCase()}
                        </span>
                        <div className="flex-1">
                          <div>{opt.text}</div>
                          {isSubmitted && opt.explanation && (
                            <div className="mt-1.5 text-[11px] text-slate-400 italic bg-slate-900/80 p-2 rounded border border-slate-800">
                              {opt.explanation}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Open Text Response Optional Box */}
              {!q.options && (
                <div className="mb-5">
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Sua Solução / Demonstração Baseada em Invariante:</label>
                  <textarea
                    value={textAnswers[q.id] || ''}
                    onChange={e => handleTextChange(q.id, e.target.value)}
                    disabled={isSubmitted}
                    rows={4}
                    placeholder="Escreva a resolução lógica/matemática apontando a invariante de sistema..."
                    className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              )}

              {/* Submit Button */}
              {!isSubmitted ? (
                <button
                  onClick={() => handleSubmitQuestion(q.id)}
                  disabled={!selectedAnswers[q.id] && !textAnswers[q.id]}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-2"
                >
                  Confirmar Resposta & Validar Invariantes <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                /* Detailed Invariant Solution Drawer */
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                      <ShieldAlert className="w-4 h-4" />
                      Invariante Esperado: <span className="font-mono text-slate-200">{q.expectedInvariant}</span>
                    </div>

                    <div className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed border-t border-slate-800/80 pt-2.5">
                      <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">
                        Gabarito Comentado Nível MIT:
                      </span>
                      {q.detailedInvariantSolution}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

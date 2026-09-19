import React from 'react';
import { ShieldCheck, Award, X, Download, CheckCircle2 } from 'lucide-react';

interface StudentCertificateModalProps {
  studentName?: string;
  completionDate?: string;
  totalScore: number;
  unlockedInvariantsCount: number;
  onClose: () => void;
}

export const StudentCertificateModal: React.FC<StudentCertificateModalProps> = ({
  studentName = 'Estudante de Engenharia de Software',
  completionDate = new Date().toLocaleDateString('pt-BR'),
  totalScore,
  unlockedInvariantsCount,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-[#0] bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-emerald-500/60 rounded-2xl shadow-2xl overflow-hidden p-8 font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Frame Content */}
        <div className="border border-emerald-800/80 bg-slate-950 p-8 rounded-xl text-center relative overflow-hidden space-y-6">
          {/* Watermark / Background Glow */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Badge & Title Header */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Award className="w-10 h-10 text-slate-950" />
            </div>
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
              Certificado de Conclusão EAD — MIT-Grade
            </span>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              CS-901: Enterprise AI, Protocol & Software Synthesis Engine
            </h1>
          </div>

          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto" />

          {/* Body Text */}
          <div className="space-y-3 text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-mono">
              Certificamos que o(a) estudante
            </p>
            <p className="text-xl font-bold text-emerald-300 font-mono underline decoration-emerald-500/50 underline-offset-4">
              {studentName}
            </p>
            <p className="text-xs text-slate-300">
              Concluiu com êxito todas as etapas teóricas, laboratórios interativos e testes rigorosos de avaliação do currículo avançado em Engenharia de Software, Arquitetura Distribuída e Protocolos de IA.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800 font-mono text-left">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Aproveitamento</span>
              <strong className="text-sm text-emerald-400">{totalScore}% de Acertos</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Invariantes Dominados</span>
              <strong className="text-sm text-teal-300">{unlockedInvariantsCount} / 40 Invariantes</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Data de Emissão</span>
              <strong className="text-sm text-slate-200">{completionDate}</strong>
            </div>
          </div>

          {/* Invariants Seal */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-emerald-400/90 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Validação Determinística Zero-Mock & Consistência Formal de Agregados</span>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-center gap-4">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Baixar / Imprimir Certificado
            </button>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs px-5 py-2.5 rounded-xl transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

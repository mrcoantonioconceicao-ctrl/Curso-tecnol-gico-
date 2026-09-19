import React, { useState } from 'react';
import { SagaOrchestrator } from '../../data/modules/m6_bpmn';
import { KaTeXMath } from '../KaTeXMath';
import { GitCommit, Play, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const BPMNPetriNetSimulatorUI: React.FC = () => {
  const [orchestrator] = useState(() => new SagaOrchestrator());
  const [logs, setLogs] = useState<string[]>([]);
  const [failStep3, setFailStep3] = useState(true);
  const [sagaRunning, setSagaRunning] = useState(false);

  const runSagaSimulation = async () => {
    setSagaRunning(true);
    setLogs(['[SAGA] Iniciando Transação Distribuída Orquestrada...']);

    const steps = [
      {
        name: 'T1: Reservar Voo (Aéreo)',
        execute: async () => {
          setLogs(p => [...p, '-> Executou T1 (Reservar Voo)']);
          return true;
        },
        compensate: async () => {
          setLogs(p => [...p, '<- Compensou C1 (Cancelar Voo)']);
          return true;
        }
      },
      {
        name: 'T2: Reservar Hotel (Hospedagem)',
        execute: async () => {
          setLogs(p => [...p, '-> Executou T2 (Reservar Hotel)']);
          return true;
        },
        compensate: async () => {
          setLogs(p => [...p, '<- Compensou C2 (Cancelar Hotel) - [C_i(C_i(x)) Idempotente]']);
          return true;
        }
      },
      {
        name: 'T3: Debitar Cartão de Crédito',
        execute: async () => {
          if (failStep3) {
            setLogs(p => [...p, '[ERRO BANCO] T3 Falhou com Recusa de Crédito!']);
            return false;
          }
          setLogs(p => [...p, '-> Executou T3 (Debitar Cartão)']);
          return true;
        },
        compensate: async () => {
          setLogs(p => [...p, '<- Compensou C3 (Estornar Cartão)']);
          return true;
        }
      }
    ];

    const result = await orchestrator.executeSaga(steps);
    if (result.success) {
      setLogs(p => [...p, '=== SAGA CONCLUÍDA COM SUCESSO ABSOLUTO ===']);
    } else {
      setLogs(p => [...p, '=== SAGA ABORTADA: COMPENSAÇÕES LIFO CONCLUÍDAS COM SUCESSO ===']);
    }
    setSagaRunning(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 font-sans shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
            <GitCommit className="w-5 h-5" /> Simulador de Orquestração SAGA & Compensações Idempotentes (BPMN / Petri)
          </h3>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
            <span>Simulação da ordem de compensação LIFO e idempotência:</span>
            <KaTeXMath math="C_{k-1} \to \dots \to C_1 \quad \text{com} \quad C_i(C_i(x)) = C_i(x)" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">Injeção de Falha em Runtime:</label>
            <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={failStep3}
                onChange={e => setFailStep3(e.target.checked)}
                className="rounded text-orange-500 focus:ring-0 bg-slate-900"
              />
              Simular falha na etapa T3 (Debitar Cartão)
            </label>
          </div>

          <button
            onClick={runSagaSimulation}
            disabled={sagaRunning}
            className="mt-4 w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Executar SAGA Pipeline
          </button>
        </div>

        {/* Execution Log */}
        <div className="md:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 mb-2">Console da Máquina de Estados SAGA:</div>
          <div className="font-mono text-xs text-slate-300 space-y-1.5 max-h-[180px] overflow-y-auto">
            {logs.length === 0 ? (
              <span className="text-slate-600 italic">Aguardando disparo da SAGA...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={log.includes('<-') ? 'text-orange-400 font-semibold' : log.includes('ERRO') ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

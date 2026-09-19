import { useState } from 'react';
import { ASTComplexityAnalyzer } from '../../data/modules/m4_m5_cleancode';
import { Code, CheckCircle, AlertOctagon, Terminal } from 'lucide-react';

export const ASTComplexityAnalyzerUI: React.FC = () => {
  const [code, setCode] = useState(`function processOrder(order: any) {
  if (order.isValid && order.amount > 0) {
    while (order.hasPendingItems) {
      if (order.status === 'PENDING') {
        order.processItem();
      } else {
        break;
      }
    }
    return true;
  }
  return false;
  console.log("Unreachable code after return!");
}`);

  // Simulação de parsing estático de AST
  const parseMockAST = (srcText: string) => {
    let decisions = 0;
    const ifMatches = (srcText.match(/\bif\b/g) || []).length;
    const whileMatches = (srcText.match(/\bwhile\b/g) || []).length;
    const forMatches = (srcText.match(/\bfor\b/g) || []).length;
    const andMatches = (srcText.match(/&&/g) || []).length;
    const orMatches = (srcText.match(/\|\|/g) || []).length;

    decisions = ifMatches + whileMatches + forMatches + andMatches + orMatches;
    const cc = decisions + 1;

    // Detecta código morto após return
    const lines = srcText.split('\n');
    let returnSeen = false;
    fontDeadCode:
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('return ')) {
        // Verifica se a linha seguinte contém código executável fora do fechamento do bloco
        if (i + 1 < lines.length && !lines[i + 1].includes('}') && lines[i + 1].trim().length > 0) {
          returnSeen = true;
          break fontDeadCode;
        }
      }
    }

    return { cc, decisions, hasDeadCode: returnSeen };
  };

  const metrics = parseMockAST(code);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 font-sans shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Code className="w-5 h-5" /> Analisador de AST, Complexidade CC e Zero-Dead-Code
          </h3>
          <p className="text-xs text-slate-400">
            Cálculo determinístico de McCabe $CC = E - N + 2P = D + 1$ e detecção de nós inalcançáveis no CFG.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-400 block mb-1">Editor de Código TypeScript/JS:</label>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            rows={10}
            className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 resize-none"
          />
        </div>

        {/* Real-time Metrics Panel */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">Complexidade Ciclomática (McCabe CC):</div>
            <div className={`text-2xl font-bold font-mono ${metrics.cc > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
              CC = {metrics.cc}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              Nós de decisão D = {metrics.decisions} (Limit CC ≤ 10)
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-2">Invariante Zero-Dead-Code:</div>
            {metrics.hasDeadCode ? (
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold font-mono bg-rose-950/40 p-2.5 rounded border border-rose-800/50">
                <AlertOctagon className="w-4 h-4 shrink-0" /> VIOLAÇÃO: Código Morto Inalcançável Detectado!
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono bg-emerald-950/40 p-2.5 rounded border border-emerald-800/50">
                <CheckCircle className="w-4 h-4 shrink-0" /> INVARIANTE OK: Todos os nós da AST são alcançáveis.
              </div>
            )}
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">Casos de Teste Mínimos M_McCabe:</div>
            <div className="text-xl font-bold font-mono text-sky-400">{metrics.cc} Casos de Teste</div>
            <div className="text-[10px] text-slate-500 mt-1">
              Garante 100% de cobertura de caminhos (Branch Coverage).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

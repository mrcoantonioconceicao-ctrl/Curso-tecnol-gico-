import { useState } from 'react';
import { LoRACalculator } from '../../data/modules/m3_finetuning';
import { KaTeXMath } from '../KaTeXMath';
import { Calculator, Cpu, Database, Zap } from 'lucide-react';

export const LoRACalculatorUI: React.FC = () => {
  const [dIn, setDIn] = useState(4096);
  const [dOut, setDOut] = useState(4096);
  const [rank, setRank] = useState(16);
  const [alpha, setAlpha] = useState(32);

  const stats = LoRACalculator.calculateParams({
    d: dIn,
    k: dOut,
    r: rank,
    alpha
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 font-sans shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
            <Calculator className="w-5 h-5" /> Calculadora Matemática de Parâmetros LoRA / QLoRA
          </h3>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
            <span>Cálculo de decomposição de baixo posto:</span>
            <KaTeXMath math="W_0 + \Delta W = W_0 + \frac{\alpha}{r} B A" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Dimensão d_in:</label>
          <input
            type="number"
            value={dIn}
            onChange={e => setDIn(Number(e.target.value))}
            className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-2.5 rounded border border-slate-800"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Dimensão d_out:</label>
          <input
            type="number"
            value={dOut}
            onChange={e => setDOut(Number(e.target.value))}
            className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-2.5 rounded border border-slate-800"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Posto (Rank r): {rank}</label>
          <select
            value={rank}
            onChange={e => setRank(Number(e.target.value))}
            className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-2.5 rounded border border-slate-800"
          >
            <option value={4}>r = 4</option>
            <option value={8}>r = 8</option>
            <option value={16}>r = 16</option>
            <option value={32}>r = 32</option>
            <option value={64}>r = 64</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Escala alpha: {alpha}</label>
          <input
            type="number"
            value={alpha}
            onChange={e => setAlpha(Number(e.target.value))}
            className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-2.5 rounded border border-slate-800"
          />
        </div>
      </div>

      {/* Numerical Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-5 rounded-lg border border-slate-800">
        <div className="p-4 bg-slate-900/60 rounded border border-slate-800/80">
          <div className="text-xs text-slate-400 font-semibold mb-1">Parâmetros Matriz Original (W_0):</div>
          <div className="text-xl font-bold font-mono text-slate-200">{stats.originalParams.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            d_in ({dIn}) × d_out ({dOut})
          </div>
        </div>

        <div className="p-4 bg-purple-950/40 rounded border border-purple-800/50">
          <div className="text-xs text-purple-300 font-semibold mb-1">Parâmetros Adaptadores (A + B):</div>
          <div className="text-xl font-bold font-mono text-purple-400">{stats.loraParams.toLocaleString()}</div>
          <div className="text-[10px] text-purple-300/70 mt-1 font-mono">
            r × (d_in + d_out) = {rank} × ({dIn + dOut})
          </div>
        </div>

        <div className="p-4 bg-emerald-950/40 rounded border border-emerald-800/50">
          <div className="text-xs text-emerald-300 font-semibold mb-1">Fator de Redução de Memória:</div>
          <div className="text-xl font-bold font-mono text-emerald-400">{stats.reductionFactor.toFixed(2)}x</div>
          <div className="text-[10px] text-emerald-300/70 mt-1 font-mono">
            Fator Escala alpha / r = {stats.scaleRatio.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

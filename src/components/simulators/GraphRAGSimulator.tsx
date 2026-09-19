import React, { useState } from 'react';
import { GraphRAGEngine } from '../../data/modules/m2_graphrag';
import { Network, Search, Layers, Zap } from 'lucide-react';

export const GraphRAGSimulatorUI: React.FC = () => {
  const [query, setQuery] = useState('Quais são as diretrizes de segurança do Bounded Context de Pagamentos?');
  const [kParam, setKParam] = useState(60);
  const [isCalculated, setIsCalculated] = useState(false);

  const mockDocuments = [
    { id: 'doc_101', title: 'Manual de Arquitetura DDD & ACL', denseRank: 1, sparseRank: 4 },
    { id: 'doc_102', title: 'Segurança e Criptografia em Pagamentos', denseRank: 2, sparseRank: 1 },
    { id: 'doc_103', title: 'Especificação do SAGA Orchestrator', denseRank: 5, sparseRank: 2 },
    { id: 'doc_104', title: 'Protocolo MCP JSON-RPC', denseRank: 12, sparseRank: 15 }
  ];

  const denseMap = new Map(mockDocuments.map(d => [d.id, d.denseRank]));
  const sparseMap = new Map(mockDocuments.map(d => [d.id, d.sparseRank]));
  const rrfScores = GraphRAGEngine.computeRRF(denseMap, sparseMap, kParam);

  const sortedDocs = [...mockDocuments].sort((a, b) => (rrfScores.get(b.id) || 0) - (rrfScores.get(a.id) || 0));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 font-sans shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2">
            <Network className="w-5 h-5" /> Simulador de Busca Híbrida & Reciprocal Rank Fusion (RRF)
          </h3>
          <p className="text-xs text-slate-400">
            Combinação determinística de busca vetorial densa (HNSW) e busca esparsa (BM25) com constante de suavização k.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-400 block mb-1">Consulta de Teste (Query):</label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-slate-950 font-sans text-xs text-slate-200 pl-9 pr-3 py-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-sky-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Constante de Suavização RRF (k): {kParam}
          </label>
          <input
            type="range"
            min="10"
            max="120"
            value={kParam}
            onChange={e => setKParam(Number(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-500">Padrão recomendado: k = 60</span>
        </div>
      </div>

      {/* RRF Ranking Matrix Table */}
      <div className="bg-slate-950 rounded-lg border border-slate-800 p-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" /> Tabela de Ranks e Pontuação RRF = 1/(k + R_dense) + 1/(k + R_sparse)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Documento</th>
                <th className="py-2 px-3">Rank Denso (HNSW)</th>
                <th className="py-2 px-3">Rank Esparso (BM25)</th>
                <th className="py-2 px-3">RRF Score Final</th>
                <th className="py-2 px-3 text-right">Posição Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {sortedDocs.map((doc, index) => {
                const score = rrfScores.get(doc.id) || 0;
                return (
                  <tr key={doc.id} className={index === 0 ? 'bg-sky-950/30 font-bold text-sky-300' : 'text-slate-300'}>
                    <td className="py-2.5 px-3">{doc.title} ({doc.id})</td>
                    <td className="py-2.5 px-3">#{doc.denseRank}</td>
                    <td className="py-2.5 px-3">#{doc.sparseRank}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">{score.toFixed(6)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">#{index + 1}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

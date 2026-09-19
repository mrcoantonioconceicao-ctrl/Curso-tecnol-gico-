import React, { useState } from 'react';
import { OrderAggregate, TransactionalOutboxRepository } from '../../data/modules/m7_m8_ddd';
import { Database, Zap, RefreshCw, Layers } from 'lucide-react';

export const DDDOutboxStreamUI: React.FC = () => {
  const [repo] = useState(() => new TransactionalOutboxRepository());
  const [orderId, setOrderId] = useState('ORD-901');
  const [amount, setAmount] = useState(500);
  const [eventsLog, setEventsLog] = useState<{ id: string; type: string; payload: string; status: string }[]>([]);

  const handleCreateAndPay = async () => {
    try {
      const order = new OrderAggregate(orderId, amount);
      order.payOrder(amount);

      const events = order.getUncommittedEvents();
      await repo.saveAggregateWithOutbox(order);

      setEventsLog(prev => [
        ...events.map((e: any) => ({
          id: e.id,
          type: e.eventType,
          payload: JSON.stringify(e.payload),
          status: 'COMMITTED_IN_OUTBOX_TABLE'
        })),
        ...prev
      ]);
    } catch (err: any) {
      alert(`Violação de Invariante de Domínio: ${err.message}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 font-sans shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-teal-400 flex items-center gap-2">
            <Database className="w-5 h-5" /> Transactional Outbox & Invariantes de Agregado DDD
          </h3>
          <p className="text-xs text-slate-400">
            Escrita atômica do estado do Agregado e inserção do evento na tabela OUTBOX (Single ACID Transaction).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">ID do Pedido (Order ID):</label>
            <input
              type="text"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-200 p-2 rounded border border-slate-800 mb-3"
            />

            <label className="text-xs font-semibold text-slate-400 block mb-1">Valor do Pedido ($):</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full bg-slate-900 text-xs text-slate-200 p-2 rounded border border-slate-800 mb-3"
            />
          </div>

          <button
            onClick={handleCreateAndPay}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" /> Criar, Pagar & Commit Outbox
          </button>
        </div>

        {/* Outbox Table Viewer */}
        <div className="md:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" /> Tabela de Eventos OUTBOX (CDC Polling Buffer):
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Event ID</th>
                  <th className="py-2 px-3">Tipo de Evento</th>
                  <th className="py-2 px-3">Payload</th>
                  <th className="py-2 px-3 text-right">Status ACID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {eventsLog.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-600 italic">
                      Nenhum evento gravado no Outbox. Clique no botão ao lado.
                    </td>
                  </tr>
                ) : (
                  eventsLog.map(evt => (
                    <tr key={evt.id} className="text-slate-300">
                      <td className="py-2 px-3 text-teal-400 font-bold">{evt.id}</td>
                      <td className="py-2 px-3">{evt.type}</td>
                      <td className="py-2 px-3 text-slate-400 max-w-[200px] truncate">{evt.payload}</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-semibold">
                        {evt.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

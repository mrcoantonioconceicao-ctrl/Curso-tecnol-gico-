import React, { useState } from 'react';
import { MCPServerSandbox } from '../../data/modules/m1_mcp';
import { Play, Shield, Terminal, Cpu, CheckCircle, AlertTriangle } from 'lucide-react';

export const MCPSandboxUI: React.FC = () => {
  const [server] = useState(() => new MCPServerSandbox());
  const [customRequest, setCustomRequest] = useState(
    JSON.stringify({ jsonrpc: '2.0', id: 101, method: 'initialize' }, null, 2)
  );
  const [log, setLog] = useState<{ type: 'in' | 'out' | 'system'; text: string; time: string }[]>([
    {
      type: 'system',
      text: 'Servidor MCP Inicializado em Modo Sandbox (cgroups v2: memory.max=256MB, pids.max=20, CLONE_NEWPID | CLONE_NEWNET).',
      time: new Date().toLocaleTimeString()
    }
  ]);
  const [cgroupLimit, setCgroupLimit] = useState(256);
  const [enforceAntiInjection, setEnforceAntiInjection] = useState(true);

  const sendRequest = async (payloadText?: string) => {
    const textToSend = payloadText || customRequest;
    const now = new Date().toLocaleTimeString();

    setLog(prev => [...prev, { type: 'in', text: textToSend, time: now }]);

    try {
      const response = await server.handleMessage(textToSend);
      if (response) {
        setLog(prev => [...prev, { type: 'out', text: response, time: new Date().toLocaleTimeString() }]);
      } else {
        setLog(prev => [...prev, { type: 'system', text: 'Notificação processada sem retorno (sem id).', time: new Date().toLocaleTimeString() }]);
      }
    } catch (err: any) {
      setLog(prev => [...prev, { type: 'system', text: `[ERRO KERNEL]: ${err.message}`, time: new Date().toLocaleTimeString() }]);
    }
  };

  const handleQuickAction = (action: string) => {
    let reqObj: any = {};
    if (action === 'initialize') {
      reqObj = { jsonrpc: '2.0', id: 1, method: 'initialize' };
    } else if (action === 'notify_initialized') {
      reqObj = { jsonrpc: '2.0', method: 'notifications/initialized' };
    } else if (action === 'tools_list') {
      reqObj = { jsonrpc: '2.0', id: 2, method: 'tools/list' };
    } else if (action === 'exec_math') {
      reqObj = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'exec_math', arguments: { expression: '(15 * 4) + 120 / 3' } }
      };
    } else if (action === 'read_resource') {
      reqObj = {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'read_secure_resource', arguments: { resourceId: 'email_inbox_1' } }
      };
    } else if (action === 'malicious_injection') {
      reqObj = {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'exec_math',
          arguments: { expression: "process.exit(1); // 'rm -rf /'" }
        }
      };
    }
    const str = JSON.stringify(reqObj, null, 2);
    setCustomRequest(str);
    sendRequest(str);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 font-sans shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <Terminal className="w-5 h-5" /> Inspector & Runner Interativo MCP JSON-RPC 2.0
          </h3>
          <p className="text-xs text-slate-400">
            Simulador de transporte Stdio com isolamento cgroups e barreira contra Indirect Prompt Injection.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 px-2.5 py-1 rounded-full">
            <Shield className="w-3.5 h-3.5" /> Namespace: Isolated (CLONE_NEWNET)
          </span>
          <span className="flex items-center gap-1 bg-sky-950/80 text-sky-300 border border-sky-800/50 px-2.5 py-1 rounded-full">
            <Cpu className="w-3.5 h-3.5" /> cgroup: {cgroupLimit}MB
          </span>
        </div>
      </div>

      {/* Control Quick Actions */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Ações Rápidas de Teste de Invariante:
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickAction('initialize')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded border border-slate-700 transition"
          >
            1. initialize
          </button>
          <button
            onClick={() => handleQuickAction('notify_initialized')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded border border-slate-700 transition"
          >
            2. notify: initialized
          </button>
          <button
            onClick={() => handleQuickAction('tools_list')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded border border-slate-700 transition"
          >
            3. tools/list
          </button>
          <button
            onClick={() => handleQuickAction('exec_math')}
            className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-mono rounded border border-emerald-700 transition"
          >
            4. tools/call (exec_math)
          </button>
          <button
            onClick={() => handleQuickAction('read_resource')}
            className="px-3 py-1.5 bg-sky-900/60 hover:bg-sky-800 text-sky-200 text-xs font-mono rounded border border-sky-700 transition"
          >
            5. Anti-Injection Envelope
          </button>
          <button
            onClick={() => handleQuickAction('malicious_injection')}
            className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-mono rounded border border-rose-700 transition flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Testar Injeção Maliciosa
          </button>
        </div>
      </div>

      {/* Payload Editor & Execution Terminal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Requisição JSON-RPC 2.0 (Envio via Stdio Pipe):
          </label>
          <textarea
            value={customRequest}
            onChange={e => setCustomRequest(e.target.value)}
            rows={8}
            className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/80 resize-none"
          />
          <button
            onClick={() => sendRequest()}
            className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Disparar Mensagem JSON-RPC 2.0
          </button>
        </div>

        {/* Live Stream Terminal */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400">Terminal Log / Output Stream:</span>
            <button
              onClick={() => setLog([])}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline"
            >
              Limpar Logs
            </button>
          </div>
          <div className="flex-1 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] overflow-y-auto max-h-[260px] space-y-2">
            {log.map((item, idx) => (
              <div key={idx} className="border-b border-slate-900/80 pb-1.5">
                <span className="text-[10px] text-slate-600 mr-2">[{item.time}]</span>
                {item.type === 'in' && (
                  <span className="text-sky-400 font-semibold">&gt;&gt; REQUEST:</span>
                )}
                {item.type === 'out' && (
                  <span className="text-emerald-400 font-semibold">&lt;&lt; RESPONSE:</span>
                )}
                {item.type === 'system' && (
                  <span className="text-amber-400 font-semibold">[KERNEL SYSTEM]:</span>
                )}
                <pre className="mt-1 text-slate-300 whitespace-pre-wrap break-all bg-slate-900/50 p-1.5 rounded">
                  {item.text}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

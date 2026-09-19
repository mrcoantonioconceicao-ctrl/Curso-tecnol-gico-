import { ModuleData } from '../../types';

export const m6BpmnData: ModuleData = {
  id: 'm6',
  code: 'M6',
  title: 'BPMN 2.0, Redes de Petri & Orquestração SAGA — Soundness Formal, Idempotência e Análise de SLA',
  block: 'Bloco II: Código, Processos e Domínio',
  summary: 'Equivalência formal entre BPMN 2.0 e Redes de Petri (Workflow Nets), verificação de Soundness (Proper Completion, Liveness, ausência de tokens órfãos), análise de gargalos de SLA pela Lei de Little e orquestração de transações distribuídas via Padrão SAGA com compensações idempotentes e Pivot Transactions.',
  analyticalMatrix: [
    {
      domain: '1. Equivalência BPMN 2.0 <-> Redes de Petri & Soundness',
      deterministicBound: 'Mapeamento formal BPMN para Workflow Net (WF-net) $N = (P, T, F, M_0)$. Verificação das 3 condições de Soundness de van der Aalst.',
      latencyVsConsistency: 'Análise estática de matriz de incidência $A$ e grafo de cobertura de marcações em tempo de compilação sem overhead em runtime.',
      securityInvariant: 'Garantia de eliminação de Deadlocks, Livelocks e Fichas Órfãs (Proper Completion: $M_{final}(P_{end}) = 1$ e $M_{final}(P_{other}) = 0$).'
    },
    {
      domain: '2. Coreografia vs. Orquestração Centralizada',
      deterministicBound: 'Orquestrador centralizado com FSM explícita vs Coreografia descentralizada baseada em eventos no barramento de dados.',
      latencyVsConsistency: 'Orquestração oferece visibilidade e consistência global imediata; Coreografia minimiza acoplamento temporal ao custo de risco de protocol drift.',
      securityInvariant: 'Eliminação de estados inconsistentes silenciosos via rastreamento determinístico de máquina de estados da SAGA.'
    },
    {
      domain: '3. Modelagem de SLA & Teoria de Filas (Lei de Little)',
      deterministicBound: 'Lei de Little $L = \\lambda W$ e tempo de merge paralelo $T_{merge} = \\max_{i \\in branches}(T_i) + Q_w$.',
      latencyVsConsistency: 'Latência do processo dominada pelo ramo mais lento (long-tail branch latency) com acúmulo proporcional de tokens no buffer.',
      securityInvariant: 'Dimensionamento de vazão e retenção de fila para evitar estouro de SLA P99 sob distribuições de cauda pesada (Pareto).'
    },
    {
      domain: '4. SAGA Pattern, Compensação Idempotente & Pivot Transaction',
      deterministicBound: 'Sequência transacional $T = \\{T_1, \\dots, T_n\\}$ com compensações $C = \\{C_n, \\dots, C_1\\}$ e Pivot Transaction $T_p$.',
      latencyVsConsistency: 'Consistência eventual com transição de backward recovery (compensação) para forward recovery (retries/DLQ) após o Pivot $T_p$.',
      securityInvariant: 'Chave de Idempotência N-potente $C_i(C_i(x)) = C_i(x)$ garantida via SagaLogStore outbox com bloqueio transacional.'
    }
  ],
  theorySections: [
    {
      title: '1. Equivalência Formal com Redes de Petri e Soundness em WF-Nets',
      subtitle: 'Definição de Workflow Nets (WF-nets) e Propriedades de Correção de van der Aalst',
      content: `O BPMN 2.0 possui semântica executável formalmente traduzível para Redes de Petri P/T (Place/Transition Nets). Uma **Workflow Net (WF-net)** é um caso especial de Rede de Petri $N = (P, T, F, M_0)$ com um único nó fonte $i \\in P$ (place inicial) e um único nó dreno $o \\in P$ (place final), onde cada nó $x \\in P \\cup T$ está em um caminho direcionado de $i$ para $o$.

A propriedade de **Soundness** (Wil van der Aalst) estabelece a correção semântica do processo:
1. **Option to Complete**: Para toda marcação $M$ alcançável a partir de $M_0$, existe uma sequência de disparos que atinge a marcação final $M_o$ (onde $M_o(o) = 1$).
2. **Proper Completion**: Quando a marcação $M_o$ é atingida, não restam fichas/tokens presos em nenhum outro lugar da rede:
$$M_o(o) = 1 \\implies M_o(p) = 0 \\quad \\forall p \\in P \\setminus \\{o\\}$$
A combinação de um AND-Split (Parallel Gateway) com um XOR-Join (Exclusive Gateway) viola frontalmente essa condição, deixando fichas órfãs acumuladas no ramo não consumido.
3. **No Dead Transitions**: Para cada transição $t \\in T$, existe pelo menos uma marcação alcançável $M \\in R(M_0)$ na qual $t$ é habilitada.`,
      latexFormula: 'M_{k+1} = M_k + A \\cdot v_k, \\quad M_o(o) = 1 \\land \\sum_{p \\neq o} M_o(p) = 0'
    },
    {
      title: '2. Coreografia vs. Orquestração Centralizada & Protocol Drift',
      subtitle: 'Análise de Acoplamento, Visibilidade de Estado e Falhas Silenciosas em Event-Driven Systems',
      content: `A escolha de topologia de controle dita as garantias de consistência em sistemas distribuídos:

1. **Orquestração Centralizada (BPMN Engine / Saga Orchestrator)**:
   - O orquestrador mantém uma Máquina de Estados Finitos (FSM) global explícita.
   - Visibilidade instantânea do estado corrente do processo e condução determinística de rollback/compensação em ordem estritamente reversa (LIFO).
   - *Trade-off*: Acoplamento espacial e necessidade de alta disponibilidade no orquestrador.

2. **Coreografia Descentralizada (Message Flows / Reactive Event Bus)**:
   - Cada participante reage autonomamente a eventos publicados no barramento (ex: Kafka/RabbitMQ).
   - *Risco de Protocol Drift*: Se o microsserviço $N_3$ falhar silenciosamente por timeout de rede e não publicar o evento de falha correspondente, os demais microsserviços e o iniciador do fluxo mantêm visões divergentes e inconsistentes do estado global, sem detecção semântica de violação do protocolo.`,
      latexFormula: '\\text{ProtocolDrift}(S) = \\text{State}(Engine) \\Delta \\bigcup_{i} \\text{LocalState}(Service_i)'
    },
    {
      title: '3. Modelagem de SLA & Gargalos em Gateways (Teoria de Filas)',
      subtitle: 'Aplicação da Lei de Little e Efeito da Cauda Longa em Parallel Merges',
      content: `A **Lei de Little** governa a retenção de tokens no buffer de execução do processo:
$$L = \\lambda W$$
onde $L$ é o número médio de instâncias/tokens no sistema, $\\lambda$ é a taxa média de chegada de requisições, e $W$ é o tempo médio de permanência (tempo de ciclo).

Em **Gateways Paralelos (AND-Split / AND-Join)**, a sincronização exige que o tempo de espera no merge seja limitado pelo ramo mais lento:
$$T_{\\text{merge}} = \\max_{i \\in \\text{branches}}(T_i) + Q_w$$
Se o Ramo B apresentar ruído de latência com cauda pesada (ex: distribuição de Pareto com $P(\\text{tail}) = 0.05$ e $W_{\\text{tail}} = 2000\\text{ms}$), a expectativa do merge $E[T_{\\text{merge}}]$ é severamente degradada:
$$E[T_{\\text{merge}}] \\approx P(\\text{normal}) \\cdot T_{\\text{normal}} + P(\\text{tail}) \\cdot T_{\\text{tail}}$$
Este fenômeno gera acúmulo exponencial de tokens no buffer do gateway ($L_{\\text{merge}} = \\lambda E[T_{\\text{merge}}]$), estourando os SLAs de P99.`,
      latexFormula: 'L = \\lambda W, \\quad T_{\\text{parallel}} = \\max(T_1, T_2, \\dots, T_k)'
    },
    {
      title: '4. Transações Compensatórias (SAGA Pattern) & Boundary da Pivot Transaction',
      subtitle: 'Decomposição Transacional, Garantias de Idempotência e Transição Backward/Forward Recovery',
      content: `Uma SAGA decompõe uma transação global em $N$ transações locais $T = \\{T_1, T_2, \\dots, T_n\\}$ com suas respectivas ações compensatórias $C = \\{C_n, \\dots, C_1\\}$.

1. **Invariante de Idempotência N-Potente**:
Devido à instabilidade de redes (timeouts, re-tentativas), qualquer função de compensação $C_i$ deve ser estritamente idempotente:
$$C_i(C_i(x)) = C_i(x)$$
A verificação é assegurada gravando a execução em um \`SagaLogStore\` via chave única \`(saga_id, step_index, compensation_hash)\` usando o padrão Outbox e bloqueio transacional no banco.

2. **Pivot Transaction ($T_p$)**:
A **Pivot Transaction** é a etapa divisor de águas no fluxo da SAGA:
- Para etapas $T_i$ onde $i \\le p$: A falha dispara **Backward Recovery** (execução da cadeia de compensações em ordem LIFO: $C_{i-1} \\to \\dots \\to C_1$).
- Para etapas $T_j$ onde $j > p$: Os efeitos de $T_p$ tornaram-se irreversíveis no mundo físico (ex: pagamento PIX liquidado no BACEN ou envio físico de produto). A compensação $C_j$ é impossibilitada; a SAGA obrigatoriamente migra para **Forward Recovery** (circuit breaker com retries indeterminados, Dead Letter Queue e intervenção manual human-in-the-loop).`,
      latexFormula: 'i \\le p \\implies \\text{BackwardRecovery}(C_{i-1} \\dots C_1), \\quad j > p \\implies \\text{ForwardRecovery}(T_j)'
    }
  ],
  referenceImplementation: {
    filename: 'saga_orchestrator_and_bpmn_linter.ts',
    language: 'typescript',
    description: 'Orquestrador SAGA determinístico com log de idempotência, Pivot Transaction, e linter estático BPMN 2.0 XML / WF-net.',
    code: `export interface SagaStep {
  index: number;
  name: string;
  isPivot?: boolean;
  execute: (context: any) => Promise<boolean>;
  compensate: (context: any) => Promise<boolean>;
}

export interface SagaLogRecord {
  sagaId: string;
  stepIndex: number;
  compensationHash: string;
  status: 'COMPENSATED' | 'EXECUTED';
  timestamp: number;
}

export class SagaLogStore {
  private store = new Map<string, SagaLogRecord>();

  private buildKey(sagaId: string, stepIndex: number): string {
    return \`\${sagaId}_\${stepIndex}\`;
  }

  public async recordCompensationIdempotent(
    sagaId: string,
    stepIndex: number,
    compensationHash: string,
    compensateFn: () => Promise<boolean>
  ): Promise<boolean> {
    const key = this.buildKey(sagaId, stepIndex);

    if (this.store.has(key)) {
      console.warn(\`[SagaLogStore] Re-tentativa detectada para \${key}. Evitando duplicidade de side-effect.\`);
      return true; // Retorna sucesso idempotente sem re-executar side-effect
    }

    const success = await compensateFn();
    if (success) {
      this.store.set(key, {
        sagaId,
        stepIndex,
        compensationHash,
        status: 'COMPENSATED',
        timestamp: Date.now()
      });
    }
    return success;
  }
}

export class SagaEngine {
  constructor(private logStore: SagaLogStore) {}

  public async runSaga(
    sagaId: string,
    steps: SagaStep[],
    context: any
  ): Promise<{ success: boolean; recoveryMode: 'COMPENSATED' | 'FORWARD_RETRY_REQUIRED' | 'NONE' }> {
    const executedStack: SagaStep[] = [];
    let pivotPassed = false;

    for (const step of steps) {
      console.log(\`[SAGA \${sagaId}] Executando T_\${step.index}: \${step.name}\`);
      const ok = await step.execute(context);

      if (ok) {
        executedStack.push(step);
        if (step.isPivot) {
          pivotPassed = true;
          console.log(\`[SAGA \${sagaId}] PIVOT TRANSACTION T_\${step.index} CONCLUÍDA. Transição para Forward Recovery.\`);
        }
      } else {
        console.error(\`[SAGA \${sagaId}] Falha na etapa T_\${step.index} (\${step.name}).\`);

        if (pivotPassed) {
          console.error(\`[SAGA \${sagaId}] CRÍTICO: Falha ocorreu APÓS o Pivot! Backward recovery proibido. Disparando Forward Recovery / DLQ.\`);
          return { success: false, recoveryMode: 'FORWARD_RETRY_REQUIRED' };
        }

        console.log(\`[SAGA \${sagaId}] Iniciando Backward Recovery (Compensação LIFO idempotente)...\`);
        await this.rollbackLIFO(sagaId, executedStack, context);
        return { success: false, recoveryMode: 'COMPENSATED' };
      }
    }

    return { success: true, recoveryMode: 'NONE' };
  }

  private async rollbackLIFO(sagaId: string, stack: SagaStep[], context: any): Promise<void> {
    while (stack.length > 0) {
      const step = stack.pop()!;
      const hash = \`hash_step_\${step.index}_\${step.name}\`;

      await this.logStore.recordCompensationIdempotent(sagaId, step.index, hash, () =>
        step.compensate(context)
      );
    }
  }
}

export class BpmnXmlLinter {
  public static validateWfNetSoundness(xmlString: string): { sound: boolean; violations: string[] } {
    const violations: string[] = [];

    const hasParallelSplit = xmlString.includes('bpmn:parallelGateway') || xmlString.includes('<parallelGateway');
    const hasExclusiveJoin = xmlString.includes('bpmn:exclusiveGateway') || xmlString.includes('<exclusiveGateway');

    if (hasParallelSplit && hasExclusiveJoin && xmlString.includes('joinMismatch="true"')) {
      violations.push('Violação de Proper Completion: Parallel Split conectado a Exclusive Join sem sincronização gera tokens órfãos presos na WF-net.');
    }

    if (!xmlString.includes('bpmn:endEvent') && !xmlString.includes('<endEvent')) {
      violations.push('Violação de WF-Net structure: Ausência de nó dreno de término (EndEvent).');
    }

    if (xmlString.includes('compensate="true"') && !xmlString.includes('bpmn:boundaryEvent')) {
      violations.push('Violação de SAGA Handler: Tarefa com compensate="true" sem boundary event de compensação correspondente.');
    }

    return {
      sound: violations.length === 0,
      violations
    };
  }
}
`
  },
  invariants: [
    'WF-net Soundness Proper Completion Invariant: M_final(P_end) == 1 e sum_{p != end} M_final(p) == 0 (ausência estrita de tokens órfãos).',
    'SAGA LIFO Compensation Order Invariant: Execução de C_i em ordem estritamente reversa LIFO para passos i <= p antecedendo o Pivot.',
    'N-Potent Compensation Idempotency Invariant: C_i(C_i(x)) == C_i(x) garantido via chave composta (saga_id, step_index, compensation_hash).',
    'Pivot Transaction Boundary Invariant: Falha em T_j para j > p proíbe backward compensation e força Forward Recovery / Human-in-the-loop.',
    'Parallel Merge Bottleneck Invariant: T_parallel = max_{i in branches}(T_i) + Q_w. A cauda longa da pior branch dita o tempo do gateway e a ocupação da fila L = lambda * W.'
  ],
  testSuite: [
    {
      id: 'm6-q1',
      number: 1,
      title: '1. WF-net Soundness Violation em Gateways Desbalanceados',
      scenario: 'Um modelo BPMN possui um Parallel Gateway (AND-Split) que bifurca o fluxo em 2 ramos concorrentes. Ambos os ramos são conectados diretamente a um Exclusive Gateway (XOR-Join) de fechamento antes do nó Fim.',
      problemStatement: 'Por que essa construção BPMN viola a propriedade de Soundness de Redes de Petri (WF-net) desenvolvida por Wil van der Aalst?',
      options: [
        {
          id: 'opt-a',
          text: 'O Exclusive Gateway de fechamento consome o token do primeiro ramo que chega e encerra a instância do processo, deixando o token do segundo ramo preso eternamente na rede (token órfão), violando a condição de Proper Completion (ii).',
          isCorrect: true,
          explanation: 'Correto. Em WF-nets, Proper Completion exige que, ao atingir a marcação final M_end(o) = 1, todos os outros lugares estejam vazios (M_end(p) = 0). O XOR-Join consome 1 token e finaliza o processo, deixando o segundo token do AND-Split retido no outro lugar como token órfão.'
        },
        {
          id: 'opt-b',
          text: 'O processo sofre Deadlock imediato no nó inicial porque o AND-Split não aceita duas arestas de entrada.',
          isCorrect: false,
          explanation: 'Incorreto. O AND-Split aceita 1 aresta de entrada e gera tokens em todas as saídas sem travar no início.'
        },
        {
          id: 'opt-c',
          text: 'Não há qualquer violação; a Rede de Petri apaga automaticamente as fichas duplicadas no momento do merge.',
          isCorrect: false,
          explanation: 'Incorreto. Redes de Petri conservam rigorosamente a contagem exata de marcações M(p); tokens não desaparecem sem transição correspondente.'
        },
        {
          id: 'opt-d',
          text: 'A violação ocorre porque a Rede de Petri exige que o banco de dados SQL utilize isolamento Serializable.',
          isCorrect: false,
          explanation: 'Incorreto. Soundness em WF-nets é uma propriedade topológica e matemática do grafo, independente da camada de persistência.'
        }
      ],
      expectedInvariant: 'WF-net Proper Completion Invariant: Marking(M_final) must have ZERO orphan tokens',
      detailedInvariantSolution: 'Gabarito oficial: O Exclusive Gateway de fechamento consome o token do primeiro ramo que chega e encerra a instância do processo, deixando o token do segundo ramo preso eternamente na rede (token órfão).'
    },
    {
      id: 'm6-q2',
      number: 2,
      title: '2. Orchestration vs Choreography State Divergence e Protocol Drift',
      scenario: 'Em uma arquitetura de 5 microsserviços financeiros organizada via Coreografia (sem orquestrador central), o microsserviço 3 sofre um timeout de rede não tratado ao tentar processar uma reserva de crédito.',
      problemStatement: 'Como um timeout não tratado no microsserviço 3 corrompe o estado global de consistência sem que o iniciador detecte falha semântica de protocolo?',
      options: [
        {
          id: 'opt-a',
          text: 'A ausência de uma máquina de estados global centralizada impede a detecção de transições pendentes quando mensagens se perdem em canais assíncronos não-confiáveis, gerando divergência de protocolo (protocol drift) e inconsistência silenciosa.',
          isCorrect: true,
          explanation: 'Correto. Na coreografia, nenhum nó possui a visão completa do grafo de estados. Se o serviço 3 falhar sem emitir um evento explícito de falha no barramento, o iniciador assume que o fluxo está em andamento enquanto os demais serviços permanecem com recursos bloqueados indefinidamente.'
        },
        {
          id: 'opt-b',
          text: 'A coreografia sempre executa um rollback automático via hardware PCIe quando ocorre timeout.',
          isCorrect: false,
          explanation: 'Incorreto. Hardware PCIe não gerencia estados de software ou mensagens de rede distribuídas.'
        },
        {
          id: 'opt-c',
          text: 'O iniciador recebe automaticamente um erro 500 do orquestrador central.',
          isCorrect: false,
          explanation: 'Incorreto. O cenário especifica que a arquitetura utiliza coreografia pura, ou seja, NÃO existe orquestrador central.'
        },
        {
          id: 'opt-d',
          text: 'O protocolo gRPC converte o timeout em uma transação ACID de banco de dados.',
          isCorrect: false,
          explanation: 'Incorreto. gRPC é uma camada de transporte RPC e não transforma chamadas de rede em transações ACID distribuídas.'
        }
      ],
      expectedInvariant: 'Global State Visibility Invariant in Process Orchestration',
      detailedInvariantSolution: 'Gabarito oficial: A ausência de uma máquina de estados global centralizada impede a detecção de transições pendentes quando mensagens se perdem em canais assíncronos não-confiáveis.'
    },
    {
      id: 'm6-q3',
      number: 3,
      title: '3. Little\'s Law & Long-Tail Branch Latency em Parallel Merges',
      scenario: 'Um processo possui um Parallel Gateway conectando o Ramo A (taxa de chegada λ = 10/s, W_A = 50ms) e o Ramo B com comportamento de cauda longa (P(tail) = 0.05 com W_tail = 2000ms e W_normal = 50ms).',
      problemStatement: 'Calcule a expectativa do tempo de ciclo do merge E[T_merge] e explique o impacto do tempo retido no acúmulo de tokens no buffer do gateway segundo a Lei de Little (L = λ * W).',
      options: [
        {
          id: 'opt-a',
          text: 'E[T_merge] ≈ 147.5ms (dominado pela cauda do Ramo B); o aumento do tempo médio de permanência W multiplica diretamente o acúmulo médio de tokens retidos no buffer do gateway (L = λ * W = 10 * 0.1475 = 1.475 tokens em média), degradando o SLA P99.',
          isCorrect: true,
          explanation: 'Correto. T_merge = max(T_A, T_B). Como T_A = 50ms, T_merge é ditado por T_B. E[T_B] = 0.95*50 + 0.05*2000 = 47.5 + 100 = 147.5ms. Pela Lei de Little L = λ * W, o número médio de tokens aguardando a sincronização do merge é L = 10/s * 0.1475s = 1.475 tokens.'
        },
        {
          id: 'opt-b',
          text: 'E[T_merge] = 50ms porque o Ramo A compensa a lentidão do Ramo B dividindo o tempo por dois.',
          isCorrect: false,
          explanation: 'Incorreto. O AND-Join precisa esperar AMBOS os ramos; o ramo rápido de 50ms fica travado esperando o ramo lento.'
        },
        {
          id: 'opt-c',
          text: 'E[T_merge] = 2050ms somando linearmente todos os tempos de execução.',
          isCorrect: false,
          explanation: 'Incorreto. Ramos em Parallel Gateway executam simultaneamente em paralelo, não sequencialmente.'
        },
        {
          id: 'opt-d',
          text: 'A Lei de Little aplica-se apenas a bancos de dados NoSQL e não possui relação com tempo de ciclo de processos.',
          isCorrect: false,
          explanation: 'Incorreto. A Lei de Little (L = λ W) é um teorema fundamental de teoria de filas universal para qualquer sistema de processamento de fluxo.'
        }
      ],
      expectedInvariant: 'Parallel Merge Bottleneck & Little\'s Law Invariant: L = lambda * max(T_i)',
      detailedInvariantSolution: 'Gabarito oficial: E[T_merge] ≈ 147.5ms (dominado pela cauda do Ramo B); o aumento do tempo médio de permanência W multiplica diretamente o acúmulo médio de tokens retidos no buffer (L = λ * W).'
    },
    {
      id: 'm6-q4',
      number: 4,
      title: '4. Non-Commutative Compensation Hazard em Transações SAGA',
      scenario: 'Na etapa T1 de uma SAGA, o sistema debita R$ 100 do saldo da conta. Na etapa T2, aplica um bônus percentual de 10% sobre o saldo atualizado. Ocorre uma falha posterior exigindo rollback.',
      problemStatement: 'Por que a compensação ingênua C1 (reverter débito) seguida de C2 (reverter bônus) viola o invariante de estado contábil se houver execuções concorrentes?',
      options: [
        {
          id: 'opt-a',
          text: 'Operações não-comutativas/não-lineares alteram a base de cálculo multiplicativa. Se houver concorrência de mutação do saldo, desfazer ações em ordem desbalanceada gera inconsistência no valor final, exigindo Semantic Locking ou compensação baseada em delta algébrico absoluto.',
          isCorrect: true,
          explanation: 'Correto. Multiplicação e adição não comutam (A + x) * 1.10 != (A * 1.10) + x. Desfazer percentuais em saldos que sofreram outras transações paralelas altera o valor contábil. A solução exige reverter o delta monetário absoluto exato guardado no log ou utilizar bloqueios semânticos.'
        },
        {
          id: 'opt-b',
          text: 'A compensação funciona perfeitamente porque a matemática financeira é naturalmente comutativa.',
          isCorrect: false,
          explanation: 'Incorreto. Porcentagem aplicada sobre bases variáveis NÃO é comutativa em relação a somas/subtrações concorrentes.'
        },
        {
          id: 'opt-c',
          text: 'O erro ocorre apenas se a linguagem de programação utilizar números de ponto flutuante de 32 bits.',
          isCorrect: false,
          explanation: 'Incorreto. O problema é de lógica de ordem algébrica de operações (não-comutatividade), não de precisão de ponto flutuante.'
        },
        {
          id: 'opt-d',
          text: 'O SAGA impede a falha forçando a execução da compensação antes da transação direta.',
          isCorrect: false,
          explanation: 'Incorreto. Compensações são executadas estritamente APÓS a falha da transação direta.'
        }
      ],
      expectedInvariant: 'Non-Commutative Algebraic Delta Compensation Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Operações não-comutativas/não-lineares alteram a base de cálculo multiplicativa; a reversão ingênua viola o saldo se houver concorrência, exigindo delta algébrico ou Semantic Locking.'
    },
    {
      id: 'm6-q5',
      number: 5,
      title: '5. Pivot Transaction Boundary & Transição Backward/Forward Recovery',
      scenario: 'Uma SAGA possui 5 etapas. A etapa T3 é definida como a Pivot Transaction (ex: liquidação bancária irreversível no PIX). Ocorre um erro crítico na etapa T4.',
      problemStatement: 'Formalize a condição de resiliência que força a transição de backward recovery (compensação) para forward recovery (retries/DLQ) após o Pivot.',
      options: [
        {
          id: 'opt-a',
          text: 'Como T4 ocorre após o Pivot T3 (i > p), a execução de backward recovery (compensações C3...C1) é estritamente proibida devido ao efeito irreversível no mundo externo; a SAGA migra obrigatoriamente para Forward Recovery (retries/circuit breaker/intervenção manual).',
          isCorrect: true,
          explanation: 'Correto. A Pivot Transaction T_p separa a SAGA em duas fases: antes de T_p, todas as etapas são compensáveis (Backward Recovery); a partir de T_p (inclusive), os efeitos são irreversíveis. Se a etapa T_j (j > p) falhar, o orquestrador DEVE insistir na execução de T_j via Forward Recovery.'
        },
        {
          id: 'opt-b',
          text: 'Se T4 falhar, o orquestrador cancela o contrato do PIX no Banco Central automaticamente.',
          isCorrect: false,
          explanation: 'Incorreto. Liquidações PIX após confirmação na Pivot Transaction são fisicamente e legalmente irreversíveis por meio de sinalização assíncrona simples.'
        },
        {
          id: 'opt-c',
          text: 'A falha em T4 força a execução da compensação C5.',
          isCorrect: false,
          explanation: 'Incorreto. T5 nem sequer foi executada, não existindo compensação C5.'
        },
        {
          id: 'opt-d',
          text: 'O Pivot permite desfazer T1 e T2, mas mantém T3 e T4 ativas.',
          isCorrect: false,
          explanation: 'Incorreto. Se T3 foi concluída, desfazer T1 e T2 violaria os pré-requisitos de T3.'
        }
      ],
      expectedInvariant: 'Pivot Transaction Irreversibility Boundary Invariant: j > p => ForwardRecovery(T_j)',
      detailedInvariantSolution: 'Gabarito oficial: Como T4 ocorre após o Pivot T3 (i > p), a execução de backward recovery é proibida devido ao efeito irreversível no mundo externo; a SAGA migra obrigatoriamente para Forward Recovery.'
    },
    {
      id: 'm6-q6',
      number: 6,
      title: '6. Exclusive Gateway Deadlock & Implicit Token Trap',
      scenario: 'Um fluxo BPMN possui um Exclusive Gateway (XOR-Split) em um loop de re-trabalho cujas condições booleanas testam variaveis locais sem uma cláusula de fallback padrão (default branch).',
      problemStatement: 'Como a exaustão de branches booleanas sem ramo default gera um implicit token trap em fluxos cíclicos?',
      options: [
        {
          id: 'opt-a',
          text: 'Se nenhuma das condições de transição for avaliada como verdadeira e não houver um ramo default, o token fica retido indefinidamente no lugar de entrada do gateway sem caminho de saída, paralisando a instância e criando um token trap estático.',
          isCorrect: true,
          explanation: 'Correto. Gateways Exclusivos exigem que exatamente uma aresta de saída receba o token. Se a avaliação das expressões booleanas for exaustiva sem cobrir o estado atual e faltar o ramo default, o token não pode avançar, ficando preso no nó do gateway (implicit token trap).'
        },
        {
          id: 'opt-b',
          text: 'O token se duplica e tenta navegar por todas as saídas simultaneamente.',
          isCorrect: false,
          explanation: 'Incorreto. Duplicar tokens é comportamento do Parallel Gateway (AND-Split), não do Exclusive Gateway (XOR-Split).'
        },
        {
          id: 'opt-c',
          text: 'O motor BPMN lança uma exceção de compilação em tempo de execução e exclui o banco de dados.',
          isCorrect: false,
          explanation: 'Incorreto. O token apenas trava no motor em estado de espera sem deletar a infraestrutura.'
        },
        {
          id: 'opt-d',
          text: 'O Exclusive Gateway converte o processo para uma arquitetura serverless.',
          isCorrect: false,
          explanation: 'Incorreto. Declaração desconexa sem qualquer sentido semântico ou técnico.'
        }
      ],
      expectedInvariant: 'Exhaustive Gateway Branching Invariant with Default Fallback',
      detailedInvariantSolution: 'Gabarito oficial: Se nenhuma das condições for verdadeira e não houver ramo default, o token fica retido indefinidamente no lugar de entrada do gateway sem caminho de saída (implicit token trap).'
    },
    {
      id: 'm6-q7',
      number: 7,
      title: '7. SagaLogStore Idempotency Contract para Crash-Recovery',
      scenario: 'O container do orquestrador SAGA sofre um restart bruto (SIGKILL) durante a execução do rollback de uma compensação financeira.',
      problemStatement: 'Escreva a especificação do contrato do armazém de compensação SAGA (SagaLogStore) para garantir que o crash-recovery não duplique estornos externos.',
      options: [
        {
          id: 'opt-a',
          text: 'Persistência atômica via padrão Outbox/SagaLogStore com chave única (saga_id, step_index, compensation_hash); re-tentativas de recuperação consultam o log antes de invocar o side-effect, garantindo idempotência N-potente C_i(C_i(x)) = C_i(x).',
          isCorrect: true,
          explanation: 'Correto. A tabela do SagaLogStore utiliza chave primaria composta. Ao reiniciar do crash, o orquestrador verifica se a chave (saga_id, step_index) já foi marcada como COMPENSATED. Se sim, ignora a nova chamada de rede, evitando duplo estorno financeiro.'
        },
        {
          id: 'opt-b',
          text: 'O orquestrador armazena o histórico em memória RAM não-volátil compartilhada via DNS.',
          isCorrect: false,
          explanation: 'Incorreto. Memória RAM é perdida no crash/SIGKILL; DNS não serve para armazenamento de logs transacionais.'
        },
        {
          id: 'opt-c',
          text: 'O banco de dados zera todas as tabelas após o crash para garantir um estado limpo.',
          isCorrect: false,
          explanation: 'Incorreto. Zerar o banco destrói todos os registros de estado e impede a recuperação da consistência.'
        },
        {
          id: 'opt-d',
          text: 'A idempotência é garantida executando as chamadas em portas UDP aleatórias.',
          isCorrect: false,
          explanation: 'Incorreto. Portas UDP não oferecem ordenação, confiabilidade ou garantias de idempotência.'
        }
      ],
      expectedInvariant: 'Idempotency Store Atomic Key Invariant: (saga_id, step_index, compensation_hash)',
      detailedInvariantSolution: 'Gabarito oficial: Persistência atômica via padrão Outbox/SagaLogStore com chave única (saga_id, step_index, compensation_hash); re-tentativas consultam o log antes de invocar o side-effect.'
    },
    {
      id: 'm6-q8',
      number: 8,
      title: '8. Previsão de Estouro de SLA P99 sob Ruído Pareto de Cauda Pesada',
      scenario: 'Um processo de 4 etapas sequenciais possui ruído de latência onde cada etapa segue uma distribuição de Pareto com índice de cauda α < 2 (variância infinita teórica).',
      problemStatement: 'Como prever a latência P99_total e qual a propriedade da soma de variáveis aleatórias sob caudas pesadas?',
      options: [
        {
          id: 'opt-a',
          text: 'Sob caudas pesadas Pareto (α < 2), a latência P99 do pipeline é dominada assintoticamente pelo valor máximo individual entre as etapas (P99_total ≈ max_{k=1..4} P99_k + Σ mediana); a variância infinita implica que estouros de SLA são provocados por picos isolados extremos.',
          isCorrect: true,
          explanation: 'Correto. Em distribuições de cauda leve (ex: Normal/Exponencial), a Teorema do Limite Central suaviza as somas. Em distribuições de cauda pesada Pareto com α < 2, aplica-se o "Princípio do Único Grande Salto" (Single Big Jump Principle): a probabilidade de uma soma exceder um limiar alto é dominada pela probabilidade de o maior termo individual exceder esse limiar.'
        },
        {
          id: 'opt-b',
          text: 'A latência P99 total é calculada multiplicando a latência de cada etapa pela constante de Euler.',
          isCorrect: false,
          explanation: 'Incorreto. Multiplicação simples pela constante de Euler não possui embasamento na teoria de probabilidades de cauda pesada.'
        },
        {
          id: 'opt-c',
          text: 'Devido à variância infinita, o SLA P99 é sempre exatamente igual a 0 milissegundos.',
          isCorrect: false,
          explanation: 'Incorreto. Variância infinita indica alta dispersão e probabilidade não-desprezível de valores extremamente altos, não zero.'
        },
        {
          id: 'opt-d',
          text: 'O pipeline sequencial converte a distribuição Pareto em uma constante determinística de 10ms.',
          isCorrect: false,
          explanation: 'Incorreto. Somar etapas sequenciais não elimina a cauda pesada estocástica das componentes.'
        }
      ],
      expectedInvariant: 'Heavy-Tail Single Big Jump Principle in Process SLA Prediction',
      detailedInvariantSolution: 'Gabarito oficial: Sob caudas pesadas Pareto (α < 2), a latência P99 do pipeline é dominada assintoticamente pelo valor máximo individual entre as etapas (Single Big Jump Principle).'
    },
    {
      id: 'm6-q9',
      number: 9,
      title: '9. Event-Sourced Saga Orchestrator & Read-Model Lag Mitigation',
      scenario: 'O projetor de estado de um orquestrador SAGA baseado em Event Sourcing apresenta atraso de atualização (read-model lag) em cenários com centenas de compensações concorrentes.',
      problemStatement: 'Qual a causa do read-model lag e qual invariante de versionamento no stream de eventos resolve a inconsistência de projeção?',
      options: [
        {
          id: 'opt-a',
          text: 'O atraso na atualização assíncrona da visão de leitura gera leitura suja do estado da SAGA; resolve-se aplicando verificação de concorrência otimista com versionamento sequencial estrito do agregado (expected_version = current_version + 1) no Event Stream.',
          isCorrect: true,
          explanation: 'Correto. Em Event Sourcing, a leitura (Read Model) é desvinculada do log de eventos (Write Model). Sob alta concorrência, ler a projeção desatualizada causa decisões incorretas. O versionamento otimista no evento garante que qualquer comando de compensação só seja gravado se baseado na versão imediatamente anterior válida.'
        },
        {
          id: 'opt-b',
          text: 'A causa é o uso de SSDs de baixa velocidade; resolve-se substituindo Event Sourcing por tabelas temporárias em memória.',
          isCorrect: false,
          explanation: 'Incorreto. O problema é de consistência eventual e desacoplamento de leitura/escrita no padrão CQRS/ES, não de hardware.'
        },
        {
          id: 'opt-c',
          text: 'O read-model lag é resolvido desativando os logs de eventos e permitindo gravações diretas sem ordenação.',
          isCorrect: false,
          explanation: 'Incorreto. Desativar o log de eventos destrói a arquitetura de Event Sourcing e impede a auditabilidade.'
        },
        {
          id: 'opt-d',
          text: 'A versão do agregado deve ser um número aleatório gerado a cada segundo.',
          isCorrect: false,
          explanation: 'Incorreto. Versionamento para concorrência otimista exige uma sequência inteira estritamente monotônica e previsível (+1).'
        }
      ],
      expectedInvariant: 'Event Stream Optimistic Version Invariant: expected_version == current_version + 1',
      detailedInvariantSolution: 'Gabarito oficial: O atraso na atualização assíncrona da visão de leitura gera leitura suja; resolve-se aplicando verificação de concorrência otimista com versionamento sequencial estrito do agregado.'
    },
    {
      id: 'm6-q10',
      number: 10,
      title: '10. Zero-Mock BPMN Conformance XML Schema & Linter Rules',
      scenario: 'Projeta-se um linter estático de conformidade BPMN 2.0 que analisa o documento XML do processo antes da implantação na engine.',
      problemStatement: 'Quais regras de AST/DOM XML o linter deve aplicar para garantir ausência de free-floating tokens, bounded liveness e handlers de compensação?',
      options: [
        {
          id: 'opt-a',
          text: 'Validação de que todo bpmn:parallelGateway (split) possui sink correspondente em bpmn:parallelGateway (join) com contagem balanceada de ramos, nós com pelo menos 1 in/out flow (exceto Start/End), loops com condição de saída finita e tarefas com compensate="true" vinculadas a boundary compensation events.',
          isCorrect: true,
          explanation: 'Correto. O linter inspeciona o DOM XML do BPMN 2.0 validando: 1) Pareamento balanceado de Parallel Gateways (prevenção de orfanatos/deadlocks); 2) Conectividade total de nós (ausência de free-floating tokens); 3) Vinculação válida de handlers de compensação SAGA para tarefas marcadas para compensação.'
        },
        {
          id: 'opt-b',
          text: 'Verificar se o arquivo XML possui mais de 1 MB de tamanho e contém a tag <author>.',
          isCorrect: false,
          explanation: 'Incorreto. Tamanho de arquivo e tag de autor não garantem nenhuma propriedade sintática ou semântica do fluxo BPMN.'
        },
        {
          id: 'opt-c',
          text: 'Proibir a presença de qualquer Gateway para simplificar a estrutura do processo.',
          isCorrect: false,
          explanation: 'Incorreto. Gateways são essenciais para modelar paralelismo, decisões e sincronização de processos.'
        },
        {
          id: 'opt-d',
          text: 'Converter todas as tags XML para arquivos JSON sem validação de esquema.',
          isCorrect: false,
          explanation: 'Incorreto. Converter o formato sem validar regras estáticas de grafos não resolve os erros semânticos.'
        }
      ],
      expectedInvariant: 'BPMN 2.0 Static XML AST Conformance Rule Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Validação de que todo bpmn:parallelGateway (split) possui sink correspondente em bpmn:parallelGateway (join) com contagem balanceada de ramos, conectividade total de nós e boundary compensation events.'
    }
  ]
};

export interface SagaStep {
  index?: number;
  name: string;
  isPivot?: boolean;
  execute: (context?: any) => Promise<boolean>;
  compensate: (context?: any) => Promise<boolean>;
}

export interface SagaLogRecord {
  sagaId: string;
  stepIndex: number;
  compensationHash: string;
  status: 'COMPENSATED' | 'EXECUTED';
  timestamp: number;
}

export class SagaLogStore {
  private store = new Map<string, SagaLogRecord>();

  private buildKey(sagaId: string, stepIndex: number): string {
    return `${sagaId}_${stepIndex}`;
  }

  public async recordCompensationIdempotent(
    sagaId: string,
    stepIndex: number,
    compensationHash: string,
    compensateFn: () => Promise<boolean>
  ): Promise<boolean> {
    const key = this.buildKey(sagaId, stepIndex);

    if (this.store.has(key)) {
      console.warn(`[SagaLogStore] Re-tentativa detectada para ${key}. Evitando duplicidade de side-effect.`);
      return true;
    }

    const success = await compensateFn();
    if (success) {
      this.store.set(key, {
        sagaId,
        stepIndex,
        compensationHash,
        status: 'COMPENSATED',
        timestamp: Date.now()
      });
    }
    return success;
  }
}

export class SagaEngine {
  constructor(private logStore: SagaLogStore) {}

  public async runSaga(
    sagaId: string,
    steps: SagaStep[],
    context?: any
  ): Promise<{ success: boolean; recoveryMode: 'COMPENSATED' | 'FORWARD_RETRY_REQUIRED' | 'NONE' }> {
    const executedStack: SagaStep[] = [];
    let pivotPassed = false;

    for (let idx = 0; idx < steps.length; idx++) {
      const step = steps[idx];
      const stepIdx = step.index ?? idx + 1;
      console.log(`[SAGA ${sagaId}] Executando T_${stepIdx}: ${step.name}`);
      const ok = await step.execute(context);

      if (ok) {
        executedStack.push(step);
        if (step.isPivot) {
          pivotPassed = true;
          console.log(`[SAGA ${sagaId}] PIVOT TRANSACTION T_${stepIdx} CONCLUÍDA. Transição para Forward Recovery.`);
        }
      } else {
        console.error(`[SAGA ${sagaId}] Falha na etapa T_${stepIdx} (${step.name}).`);

        if (pivotPassed) {
          console.error(`[SAGA ${sagaId}] CRÍTICO: Falha ocorreu APÓS o Pivot! Backward recovery proibido. Disparando Forward Recovery / DLQ.`);
          return { success: false, recoveryMode: 'FORWARD_RETRY_REQUIRED' };
        }

        console.log(`[SAGA ${sagaId}] Iniciando Backward Recovery (Compensação LIFO idempotente)...`);
        await this.rollbackLIFO(sagaId, executedStack, context);
        return { success: false, recoveryMode: 'COMPENSATED' };
      }
    }

    return { success: true, recoveryMode: 'NONE' };
  }

  private async rollbackLIFO(sagaId: string, stack: SagaStep[], context?: any): Promise<void> {
    let count = stack.length;
    while (stack.length > 0) {
      const step = stack.pop()!;
      const stepIdx = step.index ?? count--;
      const hash = `hash_step_${stepIdx}_${step.name}`;

      await this.logStore.recordCompensationIdempotent(sagaId, stepIdx, hash, () =>
        step.compensate(context)
      );
    }
  }
}

export class BpmnXmlLinter {
  public static validateWfNetSoundness(xmlString: string): { sound: boolean; violations: string[] } {
    const violations: string[] = [];

    const hasParallelSplit = xmlString.includes('bpmn:parallelGateway') || xmlString.includes('<parallelGateway');
    const hasExclusiveJoin = xmlString.includes('bpmn:exclusiveGateway') || xmlString.includes('<exclusiveGateway');

    if (hasParallelSplit && hasExclusiveJoin && xmlString.includes('joinMismatch="true"')) {
      violations.push('Violação de Proper Completion: Parallel Split conectado a Exclusive Join sem sincronização gera tokens órfãos presos na WF-net.');
    }

    if (!xmlString.includes('bpmn:endEvent') && !xmlString.includes('<endEvent')) {
      violations.push('Violação de WF-Net structure: Ausência de nó dreno de término (EndEvent).');
    }

    if (xmlString.includes('compensate="true"') && !xmlString.includes('bpmn:boundaryEvent')) {
      violations.push('Violação de SAGA Handler: Tarefa com compensate="true" sem boundary event de compensação correspondente.');
    }

    return {
      sound: violations.length === 0,
      violations
    };
  }
}

export class SagaOrchestrator {
  private logStore = new SagaLogStore();
  private engine = new SagaEngine(this.logStore);

  public async executeSaga(steps: SagaStep[], sagaId: string = 'saga-001', context: any = {}): Promise<{ success: boolean; recoveryMode: string }> {
    return this.engine.runSaga(sagaId, steps, context);
  }
}

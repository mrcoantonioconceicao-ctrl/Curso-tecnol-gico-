import { ModuleData } from '../../types';

export const m7M8DddData: ModuleData = {
  id: 'm7-m8',
  code: 'M7-M8',
  title: 'SOA, Domain-Driven Design (DDD) & Consistência Distribuída — Bounded Contexts, ACL, Transactional Outbox e CDC',
  block: 'Bloco II: Código, Processos e Domínio',
  summary: 'Arquitetura SOA e DDD Tático e Estratégico: Bounded Contexts com Anti-Corruption Layer (ACL), limites e invariantes de Agregado (Aggregate Root), atomicidade dual-write via Transactional Outbox com CDC (Log-based WAL/Debezium) e consistência eventual vs forte em visões CQRS.',
  analyticalMatrix: [
    {
      domain: '1. Bounded Contexts & Anti-Corruption Layer (ACL)',
      deterministicBound: 'Delimitação linguística ubíqua estrita. ACL tradutora bidirecional M : Legacy_DTO -> Clean_Domain isola a poluição semântica e evita contaminação do modelo interno.',
      latencyVsConsistency: 'Tradução de domínio desacoplada/assíncrona no contorno para proteger o orçamento de latência e o SLA P99 do microsserviço downstream.',
      securityInvariant: 'Rejeição estrita de vazar tipos, esquemas ou estruturas legadas para dentro das entidades do Bounded Context interno.'
    },
    {
      domain: '2. Design Tático de Agregados & Invariantes Transacionais',
      deterministicBound: 'Invariantes lógicos fortes garantidos síncrona e unicamente dentro da raiz de um único Agregado (Aggregate Root) em transação ACID local.',
      latencyVsConsistency: 'Consistência forte INTRA-agregado; Consistência eventual INTER-agregados via referências por ID e eventos de domínio.',
      securityInvariant: 'Modificação de estado exclusiva através dos métodos expostos pela Raiz do Agregado com proibição de acesso direto a entidades internas.'
    },
    {
      domain: '3. Transactional Outbox Pattern & CDC (Log-based WAL)',
      deterministicBound: 'Gravação atômica ACID local (Aggregate State + Outbox Table); leitura assíncrona desacoplada via CDC sobre WAL (Change Data Capture / Debezium).',
      latencyVsConsistency: 'Eliminação de polling bottlenecks e table scans com garantia de entrega At-Least-Once e desduplicação por Idempotency Key.',
      securityInvariant: 'Atomicidade dual-write sem protocolo de bloqueio 2PC e sem risco de perda de eventos por crash de aplicação pós-commit.'
    },
    {
      domain: '4. Eventual Consistency vs. Strong Consistency Trade-offs',
      deterministicBound: 'Visões CQRS / Read Models com lag de propagação Delta t_lag; garantia Read-Your-Own-Writes via token/ETag X-Entity-Version.',
      latencyVsConsistency: 'Leitura eventual de alto rendimento com desvio temporário para nó primário em gravações recentes caso réplica esteja desatualizada.',
      securityInvariant: 'Prevenção de inconsistências temporais e conflitos de concorrência via verificação otimista (expected_version = current_version).'
    }
  ],
  theorySections: [
    {
      title: '1. Bounded Contexts e Anti-Corruption Layer (ACL)',
      subtitle: 'Isolamento de Linguagem Ubíqua e Tradução Bidirecional de Domínios Heterogêneos',
      content: `No Domain-Driven Design (DDD) Estratégico, um **Bounded Context** delimita a fronteira exata onde uma **Linguagem Ubíqua (Ubiquitous Language)** se mantém válida e inequívoca. O mesmo termo (ex: "Cliente") possui significados e estruturas completamente distintas em Vendas, Logística ou Faturamento.

Quando um Bounded Context moderno precisa interagir com um sistema legado ou externo com modelo conceitual ruim, utiliza-se uma **Anti-Corruption Layer (ACL)**:
1. A ACL atua como uma camada tradutora bidirecional:
$$M: \\text{DTO}_{\\text{legacy}} \\to \\text{Entity}_{\\text{domain}}$$
2. Impede que tipos, atributos anêmicos ou convenções de nomenclatura poluídas do legado invadam o modelo de domínio limpo.
3. *SLA & Performance*: Traduzir requisições de forma síncrona em chamadas bloqueantes degrada o SLA P99 da aplicação clientela. A arquitetura mitiga esse overhead migrando a ACL para um modelo assíncrono baseado em Separador de Comando e Consulta (CQS) ou por especificações de tradução em cache de borda.`,
      latexFormula: '\\text{DomainModel} \\cap \\text{LegacyTypes} = \\emptyset \\quad \\text{via} \\quad \\text{ACL}(M_{\\text{translator}})'
    },
    {
      title: '2. Design Tático de Agregados e Limites de Consistência ACID',
      subtitle: 'Invariantes Lógicos em Raízes de Agregado e Referência Cruzada por ID',
      content: `Um **Agregado** define uma fronteira transacional ACID estrita (\`aggregate root consistency boundary\`):
- **Garantia de Invariante**: Regras de negócio síncronas que devem ser verdadeiras $100\\%$ do tempo aplicam-se estritamente **dentro de um único Agregado**.
- **Regra da Referência por ID**: Um Agregado nunca deve conter instâncias diretas de memória de outros Agregados; a associação ocorre exclusivamente via Identificadores de Referência (\`AggregateId\`):

\`\`\`typescript
// Anti-pattern: Agregado gigante tentando validar 5 warehouses em 1 transação
class OrderAggregate {
  private warehouses: Warehouse[]; // ❌ Lock contention massivo e violação de limite
}

// Pattern DDD correto: Referência por ID e consistência eventual
class OrderAggregate {
  private warehouseIds: string[]; // ✅ Referência por ID com validação eventual inter-agregado
}
\`\`\`

Tentativas de estender transações síncronas ACID cruzando múltiplos Agregados ou Wares distintos geram contenção de bloqueio (*lock contention*), acessos lentos e acoplamento desnecessário.`,
      latexFormula: '\\forall e \\in \\text{Aggregate}, \\quad \\text{Mutate}(e) \\implies \\text{InvocatedBy}(\\text{AggregateRoot})'
    },
    {
      title: '3. Transactional Outbox Pattern & CDC (Log-based WAL)',
      subtitle: 'Eliminação da Falha de Dupla Escrita e Polling Bottlenecks',
      content: `Ao modificar o estado de um Agregado e publicar um evento em um Message Broker (ex: Kafka / RabbitMQ), tentar executar duas chamadas de rede independentes dispara o **Problema da Dupla Escrita (Dual-Write Problem)**.

1. **Transactional Outbox**:
Persiste-se a mutação do Agregado e o Evento na tabela \`OUTBOX\` dentro da **MESMA transação ACID local**:
\`\`\`sql
BEGIN TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE id = 'A1';
INSERT INTO outbox_events (id, aggregate_type, payload, status) 
VALUES ('evt_99', 'Account', '{"amount": 100}', 'PENDING');
COMMIT;
\`\`\`

2. **Change Data Capture (CDC via Write-Ahead Log)**:
Em vez de realizar consultas ativas por polling (\`SELECT * FROM outbox WHERE published = false\`), que causam varredura de tabela (*table scan*) e contenção de índices em altíssima vazão (10k events/sec), o **CDC (ex: Debezium)** lê diretamente o log de transações brutas do banco de dados (\`Write-Ahead Log / WAL\` em PostgreSQL ou \`binlog\` em MySQL). Esse mecanismo entrega os eventos ao Kafka sem sobrecarregar o motor SQL relacional, garantindo entrega **At-Least-Once** sem impacto no runtime de aplicação.`,
      latexFormula: '\\text{AtomicCommit}(\\text{StateUpdate} \\land \\text{OutboxInsert}) = \\text{True} \\lor \\text{RollbackAll}'
    },
    {
      title: '4. Consistência Eventual, CQRS e Event Sourcing',
      subtitle: 'Read-Your-Own-Writes, Tratamento de Concorrência Otimista e Snapshots $O(N-k)$',
      content: `1. **Read-Your-Own-Writes em Visões CQRS**:
Projeções assíncronas de leitura sofrem de *Read-Model Lag* (atraso de propagação $\\Delta t_{\\text{lag}}$). Se o usuário atualiza o perfil e imediatamente faz um \`GET /profile\`, o cliente pode ver dados antigos. Resolve-se retornando o token de versão do evento (\`X-Entity-Version: v_k\`) no cabeçalho do comando e exigindo \`If-Match: v_k\` ou forçando um desvio temporário (*sticky read session*) para a base primária de escrita caso a réplica de leitura ainda não tenha processado $v_k$.

2. **Tratamento de Concorrência Otimista (Optimistic Locking)**:
Quando dois comandos concorrentes (\`CheckoutOrder\` e \`ApplyDiscount\`) tentam alterar a mesma versão $v_5$ do Agregado \`Order\`, a base rejeita o segundo commit com erro de conflito de versão (HTTP 409 Conflict). O pipeline de comandos captura o 409, relê a versão mais recente $v_6$ e **re-avalia a intenção de negócio** antes de re-tentar o comando.

3. **Snapshots em Event Sourcing**:
Em Event Sourcing, o estado do Agregado $S_t$ é derivado recompondo o log histórico de eventos $S_t = \\text{Fold}(\\text{Events}, S_0)$. Reconstituir $1$ milhão de eventos históricos introduz custo computacional e de memória $O(N)$. Aplica-se snapshots periódicos serializados $S_k$; a reconstrução passa a ler apenas o snapshot $S_k$ e os deltas subsequentes, reduzindo a complexidade para $O(N - k)$.`,
      latexFormula: 'S_t = S_k + \\sum_{i=k+1}^t \\text{Event}_i, \\quad \\text{Complexity: } O(N - k)'
    }
  ],
  referenceImplementation: {
    filename: 'transactional_outbox_and_ddd_aggregate.ts',
    language: 'typescript',
    description: 'Agregado BankAccount com Property-Based Testing de Invariantes, Transactional Outbox atômico com CDC e Anti-Corruption Layer (ACL).',
    code: `export interface DomainEvent {
  id: string;
  aggregateId: string;
  eventType: string;
  payload: any;
  occurredOn: Date;
}

export class BankAccountAggregate {
  private id: string;
  private balance: number;
  private dailyWithdrawalTotal: number = 0;
  private maxDailyLimit: number;
  private version: number = 1;
  private uncommittedEvents: DomainEvent[] = [];

  constructor(id: string, initialBalance: number, maxDailyLimit: number = 1000) {
    if (initialBalance < 0) {
      throw new Error('Invariante do Agregado violada: Saldo inicial não pode ser negativo.');
    }
    this.id = id;
    this.balance = initialBalance;
    this.maxDailyLimit = maxDailyLimit;
    this.addEvent('AccountCreated', { id, balance: initialBalance });
  }

  public deposit(amount: number) {
    if (amount <= 0) {
      throw new Error('Invariante de Depósito: Valor deve ser estritamente positivo.');
    }
    this.balance += amount;
    this.version++;
    this.addEvent('MoneyDeposited', { accountId: this.id, amount, newBalance: this.balance });
  }

  public withdraw(amount: number) {
    if (amount <= 0) {
      throw new Error('Invariante de Saque: Valor deve ser estritamente positivo.');
    }
    if (this.balance - amount < 0) {
      throw new Error('Invariante Financeira Violada: Saldo insuficiente para saque (saldo negativo proibido).');
    }
    if (this.dailyWithdrawalTotal + amount > this.maxDailyLimit) {
      throw new Error('Invariante de Limite Operacional Violada: Estouro do limite diário de saque.');
    }

    this.balance -= amount;
    this.dailyWithdrawalTotal += amount;
    this.version++;
    this.addEvent('MoneyWithdrawn', { accountId: this.id, amount, newBalance: this.balance });
  }

  public getBalance(): number {
    return this.balance;
  }

  public getVersion(): number {
    return this.version;
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  public clearEvents() {
    this.uncommittedEvents = [];
  }

  private addEvent(type: string, payload: any) {
    this.uncommittedEvents.push({
      id: Math.random().toString(36).substring(2, 10),
      aggregateId: this.id,
      eventType: type,
      payload,
      occurredOn: new Date()
    });
  }
}

export class OrderAggregate {
  private id: string;
  private totalAmount: number;
  private status: 'CREATED' | 'PAID' | 'CANCELLED' = 'CREATED';
  private uncommittedEvents: DomainEvent[] = [];

  constructor(id: string, initialAmount: number) {
    if (initialAmount <= 0) {
      throw new Error('Invariante do Agregado violada: Valor total deve ser positivo.');
    }
    this.id = id;
    this.totalAmount = initialAmount;
    this.addDomainEvent('OrderCreated', { orderId: id, amount: initialAmount });
  }

  public payOrder(paymentAmount: number) {
    if (this.status !== 'CREATED') {
      throw new Error('Invariante de Estado violada: Pedido não está no estado CREATED.');
    }
    if (paymentAmount !== this.totalAmount) {
      throw new Error('Invariante Financeira violada: Valor do pagamento divergente do total.');
    }

    this.status = 'PAID';
    this.addDomainEvent('OrderPaid', { orderId: this.id, paidAmount: paymentAmount });
  }

  private addDomainEvent(type: string, payload: any) {
    this.uncommittedEvents.push({
      id: Math.random().toString(36).substring(2, 10),
      aggregateId: this.id,
      eventType: type,
      payload,
      occurredOn: new Date()
    });
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  public clearEvents() {
    this.uncommittedEvents = [];
  }
}

export class TransactionalOutboxRepository {
  public async saveAggregateWithOutbox(aggregate: BankAccountAggregate | OrderAggregate): Promise<boolean> {
    const events = aggregate.getUncommittedEvents();

    console.log('[DB TRANSACTION BEGIN - LOCAL ACID]');
    console.log(\`[DB] Gravando mutação de estado do Agregado...\`);

    for (const evt of events) {
      console.log(\`[DB OUTBOX WAL INSERT] Evento: \${evt.eventType} | Payload: \${JSON.stringify(evt.payload)}\`);
    }

    console.log('[DB TRANSACTION COMMIT SUCCESS]');
    aggregate.clearEvents();
    return true;
  }
}

export class AntiCorruptionLayer {
  public static translateLegacyLedgerToDomain(legacyDTO: {
    TXT_ID: string;
    VAL_CENT: number;
    COD_STAT: number;
  }): { id: string; amount: number; isApproved: boolean } {
    return {
      id: legacyDTO.TXT_ID,
      amount: legacyDTO.VAL_CENT / 100,
      isApproved: legacyDTO.COD_STAT === 1
    };
  }
}

export class PropertyBasedInvariantVerifier {
  public static verifyBankAccountInvariants(
    operations: Array<{ type: 'DEPOSIT' | 'WITHDRAW'; amount: number }>
  ): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    let initialBalance = 500;
    const account = new BankAccountAggregate('acc-test', initialBalance, 1000);

    for (const op of operations) {
      const currentBal = account.getBalance();
      try {
        if (op.type === 'DEPOSIT') {
          account.deposit(op.amount);
        } else {
          account.withdraw(op.amount);
        }
      } catch (err: any) {
        // Exceção esperada se violar invariante
      }

      if (account.getBalance() < 0) {
        violations.push(\`Invariante Violada: Saldo negativo (\${account.getBalance()}) detectado.\`);
      }
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }
}
`
  },
  invariants: [
    'Aggregate Boundary Consistency Invariant: Invariantes síncronas estritas são garantidas unicamente dentro da Raiz de um único Agregado em transação ACID local; comunicação inter-agregado ocorre via referências por ID e consistência eventual.',
    'Transactional Outbox Atomic Dual-Write Invariant: Commit(AggregateState) e Insert(OutboxRecord) ocorrem dentro da mesma transação ACID local do banco de dados, com CDC operando sobre o WAL para eliminar polling table scans.',
    'Anti-Corruption Layer (ACL) Isolation Invariant: Modelos, schemas e DTOs de sistemas legados ou externos são estritamente traduzidos na ACL (M: Legacy -> CleanDomain), sem vazamento de tipos para o Bounded Context interno.',
    'Read-Your-Own-Writes CQRS Invariant: Leitura imediata pós-mutação valida o token de versão (X-Entity-Version: v_k / ETag) e redireciona para a store primária se a projeção assíncrona mantiver lag Delta t_lag > 0.',
    'Property-Based Invariant Enforcer: O Agregado recusa qualquer permutação de comandos paralelos que resulte em saldo negativo ou violação de limites operacionais estipulados no domínio.'
  ],
  testSuite: [
    {
      id: 'm7-q1',
      number: 1,
      title: '1. Aggregate Boundary Violation em Validações Multidomínio',
      scenario: 'Adicionar um OrderItem a um pedido exige a validação síncrona do estoque físico total da empresa globalmente repartido em 5 warehouses (5 agregados distintos).',
      problemStatement: 'Por que forçar essa validação síncrona dentro de um único Agregado viola os princípios táticos de DDD e qual o design correto?',
      options: [
        {
          id: 'opt-a',
          text: 'Tentar englobar 5 agregados na mesma transação gera contenção massiva de lock (lock contention), alta latência e violação de coesão transacional; o correto é modelar identificadores de referência (reference by ID) e consistência eventual inter-agregados.',
          isCorrect: true,
          explanation: 'Correto. Agregados devem ser pequenos e centrados em uma única fronteira de consistência ACID local. Agrupar múltiplos warehouses em uma transação síncrona destrói a escalabilidade do sistema. Usa-se referência por ID com reserva eventual de estoque.'
        },
        {
          id: 'opt-b',
          text: 'Agregados só podem conter no máximo 2 entidades em linguagens orientadas a objetos.',
          isCorrect: false,
          explanation: 'Incorreto. A restrição é conceitual e transacional, não uma limitação arbitrária de quantidade de entidades em código.'
        },
        {
          id: 'opt-c',
          text: 'Validar estoque em múltiplos warehouses exige a conversão do banco relacional para arquivo CSV.',
          isCorrect: false,
          explanation: 'Incorreto. Arquivo CSV não resolve problemas de consistência ou concorrência em sistemas distribuídos.'
        },
        {
          id: 'opt-d',
          text: 'A validação síncrona deve ser feita diretamente no frontend via JavaScript antes do envio ao backend.',
          isCorrect: false,
          explanation: 'Incorreto. Validações de integridade de domínio no client-side podem ser burladas e não garantem concorrência de estoque no backend.'
        }
      ],
      expectedInvariant: 'Aggregate Boundary Consistency Boundary Invariant: Small Aggregates Referenced by ID',
      detailedInvariantSolution: 'Gabarito oficial: Tentar englobar 5 agregados na mesma transação gera contenção massiva de lock, alta latência e violação de coesão transacional; o correto é modelar identificadores de referência (reference by ID) e consistência eventual.'
    },
    {
      id: 'm7-q2',
      number: 2,
      title: '2. ACL Translation Overhead & Latency Budget',
      scenario: 'Uma ACL síncrona realiza transformações pesadas de formato (JSON -> Canonical Domain Model -> Protobuf com validações cruzadas) para cada requisição de entrada.',
      problemStatement: 'Como o design de ACL síncrona degrada o SLA P99 do microsserviço downstream e qual padrão assíncrono mitiga?',
      options: [
        {
          id: 'opt-a',
          text: 'ACL síncrona converte o SLA do cliente no pior somatório dos tempos de tradução e saltos de rede encadeados; mitiga-se adotando ACL assíncrona baseada em separação de comando/consulta (CQS) ou especificações de tradução em cache de borda.',
          isCorrect: true,
          explanation: 'Correto. Executar traduções complexas síncronas no caminho da requisição consome o orçamento de latência (*latency budget*) e repassa a lentidão do sistema externo ao cliente downstream. Mover a tradução para pipeline assíncrono isola o SLA.'
        },
        {
          id: 'opt-b',
          text: 'A ACL síncrona aumenta a memória RAM do servidor em 100GB, tornando o sistema imune a latência.',
          isCorrect: false,
          explanation: 'Incorreto. Aumentar a RAM não elimina a latência de saltos de rede e serialização/deserialização bloqueante.'
        },
        {
          id: 'opt-c',
          text: 'O problema é resolvido desativando a camada de segurança SSL/TLS da API.',
          isCorrect: false,
          explanation: 'Incorreto. Remover a criptografia de rede compromete a segurança sem resolver a sobrecarga computacional da tradução de domínio.'
        },
        {
          id: 'opt-d',
          text: 'A tradução de domínio não possui qualquer custo computacional por ser um processo interpretado.',
          isCorrect: false,
          explanation: 'Incorreto. Parsing, parsing de JSON/Protobuf e mapeamento de objetos consomem CPU e tempo de execução.'
        }
      ],
      expectedInvariant: 'Async Anti-Corruption Layer Isolation & Latency Budget Protection',
      detailedInvariantSolution: 'Gabarito oficial: ACL síncrona converte o SLA do cliente no pior somatório dos tempos de tradução e saltos de rede; mitiga-se com ACL assíncrona baseada em CQS ou tradução em cache.'
    },
    {
      id: 'm7-q3',
      number: 3,
      title: '3. Transactional Outbox Race / Polling Bottleneck vs CDC Log-Based WAL',
      scenario: 'Uma aplicação com vazão de 10.000 eventos/segundo utiliza o padrão Outbox consultando periodicamente a tabela via `SELECT * FROM outbox WHERE published = false`.',
      problemStatement: 'Por que o polling falha em throughput massivo e como o CDC baseado em log de WAL (Write-Ahead Log) resolve com garantia linearizável?',
      options: [
        {
          id: 'opt-a',
          text: 'Polling gera varredura contínua de tabela (table scan / index lock contention) e sobrecarrega o banco SQL; o CDC via WAL (Debezium) lê diretamente o log de transações brutas do banco sem afetar o motor de execução de queries.',
          isCorrect: true,
          explanation: 'Correto. Polling em tabela de alta gravação exige consultas constantes com locks no índice e disputa I/O com a aplicação. O Change Data Capture (CDC) lê o Write-Ahead Log (WAL) do banco de dados em plano de fundo de forma não-intrusiva.'
        },
        {
          id: 'opt-b',
          text: 'Polling falha porque bancos relacionais aceitam no máximo 10 registros na tabela Outbox.',
          isCorrect: false,
          explanation: 'Incorreto. Tabelas relacionais armazenam milhões de registros; o gargalo é a disputa de I/O e índices no polling contínuo.'
        },
        {
          id: 'opt-c',
          text: 'O CDC substitui a necessidade de ter um Message Broker como o Kafka.',
          isCorrect: false,
          explanation: 'Incorreto. O CDC (ex: Debezium) extrai as alterações do WAL e as envia EXATAMENTE para o Message Broker (Kafka).'
        },
        {
          id: 'opt-d',
          text: 'CDC funciona apenas se o banco de dados estiver instalado na mesma máquina da aplicação.',
          isCorrect: false,
          explanation: 'Incorreto. CDC conecta-se remotamente à porta de replicação do banco de dados.'
        }
      ],
      expectedInvariant: 'CDC Log-Based WAL Non-Intrusive Extraction Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Polling gera varredura contínua de tabela e sobrecarrega o banco SQL; o CDC via WAL lê diretamente o log de transações sem afetar o motor de execução.'
    },
    {
      id: 'm7-q4',
      number: 4,
      title: '4. Read-Your-Own-Writes Consistency Gap em CQRS/Event Sourcing',
      scenario: 'Um usuário atualiza seu perfil (gravação no aggregate `User`) e consulta imediatamente o endpoint `GET /profile` servido por uma projeção CQRS assíncrona com lag de 150ms.',
      problemStatement: 'Como projetar o contrato de cliente/token de versão (`Version-ID` / `ETag`) para garantir a consistência Read-your-own-writes?',
      options: [
        {
          id: 'opt-a',
          text: 'Retornar o token de versão `X-Entity-Version: v_k` no cabeçalho da resposta de mutação e exigir `If-Match: v_k` na leitura; se a réplica de leitura estiver desatualizada, desvia-se a consulta temporariamente para a store primária de escrita.',
          isCorrect: true,
          explanation: 'Correto. O padrão *Read-your-own-writes* permite que o cliente que realizou a alteração enxergue suas próprias mudanças imediatamente. O token de versão orienta o roteador/API gateway a validar se a réplica CQRS já assimilou $v_k$, caso contrário lê da fonte primária (sticky session).'
        },
        {
          id: 'opt-b',
          text: 'Forçar um comando `sleep(200ms)` na aplicação frontend antes de permitir que o usuário clique em recarregar.',
          isCorrect: false,
          explanation: 'Incorreto. Inserir atrasos artificiais no frontend é não-determinístico e destrói a experiência do usuário.'
        },
        {
          id: 'opt-c',
          text: 'Desativar completamente as réplicas de leitura e usar apenas uma base de dados central sem CQRS.',
          isCorrect: false,
          explanation: 'Incorreto. Eliminar o CQRS elimina os ganhos de escalabilidade de leitura de alta vazão.'
        },
        {
          id: 'opt-d',
          text: 'Armazenar os dados de perfil exclusivamente no LocalStorage do navegador sem consultar a API.',
          isCorrect: false,
          explanation: 'Incorreto. Armazenar apenas localmente ignora atualizações do servidor e validações de segurança.'
        }
      ],
      expectedInvariant: 'Read-Your-Own-Writes Versioned Token Invariant: Version-ID Match or Primary Store Fallback',
      detailedInvariantSolution: 'Gabarito oficial: Retornar X-Entity-Version: v_k na resposta da mutação e exigir If-Match: v_k na leitura; desviar para a store primária se a réplica de leitura estiver defasada.'
    },
    {
      id: 'm7-q5',
      number: 5,
      title: '5. Aggregate Concurrency Optimistic Locking & Intent Handler Re-Evaluation',
      scenario: 'Dois comandos concorrentes `CheckoutOrder` e `ApplyDiscount` atingem o mesmo Agregado `Order` baseado na versão inicial $v_5$.',
      problemStatement: 'Descreva a falha em cascata de rollback de transação e o design correto de tratamento de conflito de concorrência otimista.',
      options: [
        {
          id: 'opt-a',
          text: 'O banco rejeita o segundo commit por divergência de versão (esperava v5, mas encontrou v6) com erro 409/Conflict; o handler captura o erro, relê o estado atualizado v6 e re-avalia a intenção de negócio antes de re-tentar a operação.',
          isCorrect: true,
          explanation: 'Correto. No bloqueio otimista (Optimistic Locking), a colisão é detectada ao comparar o campo de versão no commit. Em vez de abortar sem tratamento, a aplicação executa o pipeline de *command retry*, relendo o estado atual $v_6$ para re-validar as regras de negócio antes de re-submeter.'
        },
        {
          id: 'opt-b',
          text: 'O banco de dados mescla as duas alterações automaticamente sem validar a versão.',
          isCorrect: false,
          explanation: 'Incorreto. Mesclar mutações concorrentes sem validação causa corrupção de estado (lost update problem).'
        },
        {
          id: 'opt-c',
          text: 'A primeira transação é revertida e a segunda é aceita cegamente.',
          isCorrect: false,
          explanation: 'Incorreto. O bloqueio otimista aceita a primeira transação que commita com sucesso ($v_5 \to v_6$) e rejeita a subsequente.'
        },
        {
          id: 'opt-d',
          text: 'O servidor trava todas as requisições até que um operador humano decida qual comando aceitar.',
          isCorrect: false,
          explanation: 'Incorreto. Concorrência de código deve ser resolvida programmaticamente em milissegundos.'
        }
      ],
      expectedInvariant: 'Optimistic Concurrency Lock & Intent Retry Re-Evaluation Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Rejeição otimista com status 409/Conflict e re-leitura do intent handler no pipeline de command retry com re-avaliação de regras sobre o novo estado v6.'
    },
    {
      id: 'm7-q6',
      number: 6,
      title: '6. Domain Event Schema Evolution & Postel\'s Law em Event Streaming',
      scenario: 'O Bounded Context de Vendas precisa evoluir o evento de domínio de `OrderPlacedV1` para `OrderPlacedV2`, adicionando novos campos obrigatórios no payload distribuído via Kafka.',
      problemStatement: 'Como evoluir o esquema do evento mantendo o desacoplamento de 12 Bounded Contexts consumidores sem quebrar aplicações legadas?',
      options: [
        {
          id: 'opt-a',
          text: 'Aplicação da Lei de Postel (Tolerant Reader pattern) via Upcasting/Downcasting adaptativo no consumidor ou ACL de eventos; novos campos devem ser opcionais com valores default para garantir compatibilidade retroativa.',
          isCorrect: true,
          explanation: 'Correto. A Lei de Postel ("Seja liberal no que aceita e conservador no que envia") orienta o *Tolerant Reader Pattern*. Consumidores ignoram campos desconhecidos. Upcasters convertem `OrderPlacedV1` para `OrderPlacedV2` dinamicamente ao ler do stream.'
        },
        {
          id: 'opt-b',
          text: 'Pausar todos os 12 microsserviços simultaneamente e fazer o deploy coordenado no mesmo segundo.',
          isCorrect: false,
          explanation: 'Incorreto. Deploy sincronizado obrigatório ("Big Bang Release") destrói a autonomia da arquitetura de microsserviços.'
        },
        {
          id: 'opt-c',
          text: 'Deletar o tópico do Kafka e recriá-lo do zero com o novo esquema.',
          isCorrect: false,
          explanation: 'Incorreto. Deletar tópicos apaga todo o histórico de eventos e interrompe o funcionamento de todo o ecossistema.'
        },
        {
          id: 'opt-d',
          text: 'Forçar todos os consumidores a usar linguagens fortemente tipadas sem suporte a campos nulos.',
          isCorrect: false,
          explanation: 'Incorreto. O tipo de linguagem nos consumidores é irrelevante para a estratégia de versionamento do schema no barramento.'
        }
      ],
      expectedInvariant: 'Tolerant Reader & Upcaster Event Schema Evolution Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Aplicação da Lei de Postel via Upcasting/Downcasting adaptativo no consumidor ou ACL de eventos; novos campos permanecem opcionais com fallbacks default.'
    },
    {
      id: 'm7-q7',
      number: 7,
      title: '7. Distributed Lock (Redlock) vs. SAGA/Outbox Trade-off em SOA',
      scenario: 'Uma equipe propõe utilizar um Distributed Lock global (ex: Redis Redlock) cobrindo chamadas HTTP síncronas entre 3 Bounded Contexts para garantir a mutação exclusiva de saldo.',
      problemStatement: 'Por que utilizar Distributed Lock cruzando contornos de contexto é um antipadrão de SOA e como o par SAGA/Outbox resolve com acoplamento frouxo?',
      options: [
        {
          id: 'opt-a',
          text: 'Distributed locks acoplam o tempo de vida da rede e a disponibilidade de um coordenador externo ao domínio de negócio, criando risco de travamento global; SAGA/Outbox garante autonomia com mutações locais atômicas e consistência eventual assíncrona.',
          isCorrect: true,
          explanation: 'Correto. Adicionar um trava distribuída (Distributed Lock) síncrona através de Bounded Contexts cria acoplamento temporal rígido e ponto único de falha no coordenador de lock. O SAGA com Transactional Outbox substitui o bloqueio por passos locais atômicos com compensações assíncronas.'
        },
        {
          id: 'opt-b',
          text: 'Distributed Lock é um antipadrão porque o Redis não suporta armazenar números inteiros.',
          isCorrect: false,
          explanation: 'Incorreto. Redis armazena perfeitamente números inteiros e estruturas de dados complexas.'
        },
        {
          id: 'opt-c',
          text: 'O padrão SAGA exige o uso de transações ACID globais de duas fases (2PC).',
          isCorrect: false,
          explanation: 'Incorreto. A principal razão de existir do SAGA é justamente ELIMINAR o 2PC e bloqueios globais.'
        },
        {
          id: 'opt-d',
          text: 'Redlock deve ser substituído por chamadas telefônicas entre os operadores do sistema.',
          isCorrect: false,
          explanation: 'Incorreto. Afirmação desprovida de fundamento técnico.'
        }
      ],
      expectedInvariant: 'Autonomous Asynchronous Boundary Invariant vs Distributed Lock Coupling',
      detailedInvariantSolution: 'Gabarito oficial: Distributed locks acoplam o tempo de vida de rede e a disponibilidade do coordenador externo; SAGA/Outbox garante autonomia local e determinismo assíncrono.'
    },
    {
      id: 'm7-q8',
      number: 8,
      title: '8. Bounded Context Context Map Anti-Patterns & Distributed Monolith',
      scenario: 'Duas equipes independentes compartilham uma biblioteca de domínio comum e o mesmo esquema de banco de dados por mais de 2 anos (Shared Kernel prolongado).',
      problemStatement: 'Identifique o antipadrão arquitetural resultante e quantifique o acoplamento decorrente.',
      options: [
        {
          id: 'opt-a',
          text: 'Shared Kernel mantido indefinidamente cria acoplamento implícito de compilação e deploy, transformando microsserviços em um Monólito Distribuído (Distributed Monolith) com dependências cíclicas e bloqueio de releases.',
          isCorrect: true,
          explanation: 'Correto. O Shared Kernel é uma estratégia temporária de transição. Se mantido a longo prazo, qualquer alteração na biblioteca compartilhada ou no banco exige compilação e deploy sincronizado de todos os microsserviços, eliminando a independência das equipes.'
        },
        {
          id: 'opt-b',
          text: 'A arquitetura evolui automaticamente para uma infraestrutura Serverless de alta performance.',
          isCorrect: false,
          explanation: 'Incorreto. Compartilhar esquemas de banco e bibliotecas não converte a aplicação em serverless.'
        },
        {
          id: 'opt-c',
          text: 'O acoplamento é zerado porque ambos usam o mesmo repositório Git.',
          isCorrect: false,
          explanation: 'Incorreto. O mesmo repositório Git com dependências cruzadas AUMENTA o acoplamento, não o zera.'
        },
        {
          id: 'opt-d',
          text: 'O antipadrão é chamado de Anti-Corruption Layer e deve ser incentivado.',
          isCorrect: false,
          explanation: 'Incorreto. Anti-Corruption Layer (ACL) é um PADRÃO de isolamento positivo, enquanto o Shared Kernel prolongado é o antipadrão.'
        }
      ],
      expectedInvariant: 'Decoupled Context Map Invariant: Avoid Prolonged Shared Kernel',
      detailedInvariantSolution: 'Gabarito oficial: Shared Kernel mantido indefinidamente cria acoplamento de compilação/deploy implícito, transformando microsserviços em um monólito distribuído.'
    },
    {
      id: 'm7-q9',
      number: 9,
      title: '9. Event Replay Bottleneck & Snapshots O(N - k) em Event Sourcing',
      scenario: 'Um Agregado financeiro possui 1.000.000 de eventos em seu historico de Event Sourcing. A cada comando, a reconstrução completa do estado atrasa o processamento.',
      problemStatement: 'Qual o gargalo computacional do replay e como snapshots com versionamento de esquema mitigam a latência?',
      options: [
        {
          id: 'opt-a',
          text: 'Reconstruct com 1M de eventos possui custo de memória e CPU O(N); snapshots periódicos serializados (S_k) com lazy load reduzem a reconstrução para os eventos delta pós-snapshot (O(N - k)), restaurando a latência constante/baixa.',
          isCorrect: true,
          explanation: 'Correto. O fold completo sobre $N$ eventos cresce linearmente. Ao salvar o estado consolidado $S_k$ a cada $1.000$ eventos, a reconstrução precisa ler apenas o último snapshot $S_k$ e aplicar os poucos eventos restantes $k+1 \dots N$.'
        },
        {
          id: 'opt-b',
          text: 'O gargalo de replay é resolvido ignorando os primeiros 900.000 eventos sem salvar snapshots.',
          isCorrect: false,
          explanation: 'Incorreto. Ignorar eventos sem um snapshot que consolide o estado corrompe a exatidão matemática do saldo/estado do Agregado.'
        },
        {
          id: 'opt-c',
          text: 'Snapshots reduzem a precisão dos cálculos do Agregado para aproximações estatísticas.',
          isCorrect: false,
          explanation: 'Incorreto. Snapshots preservam o estado exato consolidado sem qualquer perda de precisão.'
        },
        {
          id: 'opt-d',
          text: 'O replay de eventos em Event Sourcing roda em tempo O(1) naturalmente sem otimização.',
          isCorrect: false,
          explanation: 'Incorreto. Iterar sobre $N$ elementos na memória ou banco é uma operação intrinsecamente $O(N)$.'
        }
      ],
      expectedInvariant: 'Snapshot Delta Replay Invariant: S_t = S_k + Sum_{i=k+1}^t Event_i',
      detailedInvariantSolution: 'Gabarito oficial: Reconstrução com 1M de eventos possui custo O(N); snapshots periódicos serializados reduzem a leitura apenas para os eventos do delta pós-snapshot O(N - k).'
    },
    {
      id: 'm7-q10',
      number: 10,
      title: '10. Zero-Mock Domain Model Property-Based Invariant Verification Contract',
      scenario: 'Desenvolve-se uma suíte de testes baseados em propriedades (Property-Based Testing) para validar o Agregado `BankAccount`.',
      problemStatement: 'Qual a afirmação rigorosa do teste que comprova que o Agregado recusa saldo negativo ou estouro de limite sob qualquer permutação de comandos?',
      options: [
        {
          id: 'opt-a',
          text: 'Geração de sequências randômicas de comandos Deposit e Withdraw com asserção invariante contínua de que balance >= 0 e sum(deltas_aceitos) == balance_final, rejeitando qualquer operação fora do limite diário com exceções de domínio tratadas.',
          isCorrect: true,
          explanation: 'Correto. O teste de propriedades (Property-Based Testing) injeta milhares de permutações aleatórias de entradas (valores negativos, saques maiores que o saldo, e estouro de limite). O teste é considerado bem-sucedido se a invariante de integridade ($balance \ge 0$) e a equação de deltas ($balance = balance_{inicial} + \sum deposits - \sum withdrawals$) se mantiverem invioláveis.'
        },
        {
          id: 'opt-b',
          text: 'Executar um único teste unitário estático com valor pré-definido de R$ 10,00.',
          isCorrect: false,
          explanation: 'Incorreto. Testes unitários com casos fixos não cobrem o espaço de estados de permutações aleatórias do property-based testing.'
        },
        {
          id: 'opt-c',
          text: 'Mockar a classe BankAccount para que o método withdraw() retorne true sem executar a lógica.',
          isCorrect: false,
          explanation: 'Incorreto. Mockar a regra de negócio do Agregado anula a validação das invariantes de domínio (violação do princípio Zero-Mock).'
        },
        {
          id: 'opt-d',
          text: 'Validar apenas se o código compila no TypeScript sem erros de sintaxe.',
          isCorrect: false,
          explanation: 'Incorreto. Compilação de tipos não garante a correção das regras lógicas de negócio em tempo de execução.'
        }
      ],
      expectedInvariant: 'Property-Based Continuous Domain Invariant Assertion Contract',
      detailedInvariantSolution: 'Gabarito oficial: Geração de sequências randômicas de comandos Deposit e Withdraw com asserção invariante contínua de que balance >= 0 e sum(deltas_aceitos) == balance_final.'
    }
  ]
};

export interface DomainEvent {
  id: string;
  aggregateId: string;
  eventType: string;
  payload: any;
  occurredOn: Date;
}

export class BankAccountAggregate {
  private id: string;
  private balance: number;
  private dailyWithdrawalTotal: number = 0;
  private maxDailyLimit: number;
  private version: number = 1;
  private uncommittedEvents: DomainEvent[] = [];

  constructor(id: string, initialBalance: number, maxDailyLimit: number = 1000) {
    if (initialBalance < 0) {
      throw new Error('Invariante do Agregado violada: Saldo inicial não pode ser negativo.');
    }
    this.id = id;
    this.balance = initialBalance;
    this.maxDailyLimit = maxDailyLimit;
    this.addEvent('AccountCreated', { id, balance: initialBalance });
  }

  public deposit(amount: number) {
    if (amount <= 0) {
      throw new Error('Invariante de Depósito: Valor deve ser estritamente positivo.');
    }
    this.balance += amount;
    this.version++;
    this.addEvent('MoneyDeposited', { accountId: this.id, amount, newBalance: this.balance });
  }

  public withdraw(amount: number) {
    if (amount <= 0) {
      throw new Error('Invariante de Saque: Valor deve ser estritamente positivo.');
    }
    if (this.balance - amount < 0) {
      throw new Error('Invariante Financeira Violada: Saldo insuficiente para saque (saldo negativo proibido).');
    }
    if (this.dailyWithdrawalTotal + amount > this.maxDailyLimit) {
      throw new Error('Invariante de Limite Operacional Violada: Estouro do limite diário de saque.');
    }

    this.balance -= amount;
    this.dailyWithdrawalTotal += amount;
    this.version++;
    this.addEvent('MoneyWithdrawn', { accountId: this.id, amount, newBalance: this.balance });
  }

  public getBalance(): number {
    return this.balance;
  }

  public getVersion(): number {
    return this.version;
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  public clearEvents() {
    this.uncommittedEvents = [];
  }

  private addEvent(type: string, payload: any) {
    this.uncommittedEvents.push({
      id: Math.random().toString(36).substring(2, 10),
      aggregateId: this.id,
      eventType: type,
      payload,
      occurredOn: new Date()
    });
  }
}

export class OrderAggregate {
  private id: string;
  private totalAmount: number;
  private status: 'CREATED' | 'PAID' | 'CANCELLED' = 'CREATED';
  private uncommittedEvents: DomainEvent[] = [];

  constructor(id: string, initialAmount: number) {
    if (initialAmount <= 0) {
      throw new Error('Invariante do Agregado violada: Valor total deve ser positivo.');
    }
    this.id = id;
    this.totalAmount = initialAmount;
    this.addDomainEvent('OrderCreated', { orderId: id, amount: initialAmount });
  }

  public payOrder(paymentAmount: number) {
    if (this.status !== 'CREATED') {
      throw new Error('Invariante de Estado violada: Pedido não está no estado CREATED.');
    }
    if (paymentAmount !== this.totalAmount) {
      throw new Error('Invariante Financeira violada: Valor do pagamento divergente do total.');
    }

    this.status = 'PAID';
    this.addDomainEvent('OrderPaid', { orderId: this.id, paidAmount: paymentAmount });
  }

  private addDomainEvent(type: string, payload: any) {
    this.uncommittedEvents.push({
      id: Math.random().toString(36).substring(2, 10),
      aggregateId: this.id,
      eventType: type,
      payload,
      occurredOn: new Date()
    });
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  public clearEvents() {
    this.uncommittedEvents = [];
  }
}

export class TransactionalOutboxRepository {
  public async saveAggregateWithOutbox(aggregate: BankAccountAggregate | OrderAggregate): Promise<boolean> {
    const events = aggregate.getUncommittedEvents();

    console.log('[DB TRANSACTION BEGIN - LOCAL ACID]');
    console.log(`[DB] Gravando mutação de estado do Agregado...`);

    for (const evt of events) {
      console.log(`[DB OUTBOX WAL INSERT] Evento: ${evt.eventType} | Payload: ${JSON.stringify(evt.payload)}`);
    }

    console.log('[DB TRANSACTION COMMIT SUCCESS]');
    aggregate.clearEvents();
    return true;
  }
}

export class AntiCorruptionLayer {
  public static translateLegacyLedgerToDomain(legacyDTO: {
    TXT_ID: string;
    VAL_CENT: number;
    COD_STAT: number;
  }): { id: string; amount: number; isApproved: boolean } {
    return {
      id: legacyDTO.TXT_ID,
      amount: legacyDTO.VAL_CENT / 100,
      isApproved: legacyDTO.COD_STAT === 1
    };
  }
}

export class PropertyBasedInvariantVerifier {
  public static verifyBankAccountInvariants(
    operations: Array<{ type: 'DEPOSIT' | 'WITHDRAW'; amount: number }>
  ): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    const initialBalance = 500;
    const account = new BankAccountAggregate('acc-test', initialBalance, 1000);

    for (const op of operations) {
      try {
        if (op.type === 'DEPOSIT') {
          account.deposit(op.amount);
        } else {
          account.withdraw(op.amount);
        }
      } catch (err: any) {
        // Exceção esperada se violar invariante
      }

      if (account.getBalance() < 0) {
        violations.push(`Invariante Violada: Saldo negativo (${account.getBalance()}) detectado.`);
      }
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }
}


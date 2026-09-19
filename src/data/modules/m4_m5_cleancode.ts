import { ModuleData } from '../../types';

export const m4M5CleanCodeData: ModuleData = {
  id: 'm4-m5',
  code: 'M4-M5',
  title: 'Clean Code, AST Review & Concorrência — Complexidade Ciclomática/Cognitiva, AST Diff e Lock-Free Invariants',
  block: 'Bloco II: Código, Processos e Domínio',
  summary: 'Métricas exatas de engenharia de software: Complexidade Ciclomática (McCabe CC = E - N + 2P) e Cognitiva (penalidade exponencial por aninhamento), AST Diff semântico, alcance de grafo para Zero-Dead-Code, invariantes de concorrência Lock-Free (CAS/Hazard Pointers) e validação de domínio orientada a tipos.',
  analyticalMatrix: [
    {
      domain: '1. Métricas de Complexidade & Rigor Estrutural',
      deterministicBound: 'Complexidade Ciclomática: CC = E - N + 2P (CC <= 10 por função). Complexidade Cognitiva: penalização incremental de aninhamento 2^{d-1} (CC_cog <= 7). Zero-Dead-Code: R(f) > 0 a partir de entrypoints públicos.',
      latencyVsConsistency: 'Análise estática em tempo de compilação/linting O(V + E) sem overhead no tempo de execução.',
      securityInvariant: 'Garantia de testabilidade e mantibilidade: limitação rígida de caminhos de decisão e eliminação de branches inalcançáveis.'
    },
    {
      domain: '2. AST Diff Analysis & Code Review Automatizado',
      deterministicBound: 'Diff semântico D_sem(AST_v1, AST_v2) sobre a AST normalizada (AST_norm) ignorando alpha-conversion de variáveis locais e alterações estéticas.',
      latencyVsConsistency: 'Parsing O(Tokens) via compilador estático (TypeScript / Tree-sitter AST API).',
      securityInvariant: 'Code Review Gate: Rejeição automática de PR se Delta CC_cog > 0 em funções quentes sem redesenho explícito de domínio.'
    },
    {
      domain: '3. Invariantes de Concorrência & Safe-Memory',
      deterministicBound: 'Modelo de Atores vs. Lock-Free (primitivas CAS + Hazard Pointers) vs. Lock-Based. Invariante de DAG de Locks (partial order dL = empty) para prevenção de deadlocks.',
      latencyVsConsistency: 'Operações CAS com latência sub-microsegundo sem bloqueio de thread. Prevenção de MESI cache churn via hazard pointers.',
      securityInvariant: 'Garantia de ausência de Data Races e mutabilidade oculta através de Send/Sync e tipagem atômica estrita.'
    },
    {
      domain: '4. Zero-Mock AST Verification Contract',
      deterministicBound: "AST linting determinístico validando ausência de 'any', 'unwrap() / expect()' em caminhos críticos, e conformidade com limites de complexidade.",
      latencyVsConsistency: 'Validação instantânea no pipeline de CI/CD com bloqueio imediato caso Delta > 0 nos portões de qualidade.',
      securityInvariant: 'Imposição de abstrações de custo zero (Zero-Cost Abstractions) com validação de domínio em tempo de compilação.'
    }
  ],
  theorySections: [
    {
      title: '1. Complexidade Ciclomática vs. Complexidade Cognitiva',
      subtitle: 'Formulação de McCabe e Penalização Exponencial de Aninhamento',
      content: `A métrica clássica de McCabe avalia o número de caminhos linearmente independentes em um Grafo de Fluxo de Controle (CFG) $G = (V, E)$:
$$CC = E - N + 2P = D + 1$$
onde $E$ é o número de arestas, $N$ é o número de nós de controle, $P$ é o número de componentes conexos, e $D$ é o número de pontos de decisão ('if', 'while', 'for', 'case', '&&', '||').

No entanto, a Complexidade Ciclomática ($CC$) mascara o custo de manutenção mental: uma sequência plana de 10 'if's possui o mesmo $CC = 11$ do que 10 'if's profundamente aninhados.

A **Complexidade Cognitiva** ($CC_{\\text{cog}}$) corrige essa limitação adicionando uma penalidade proporcional à profundidade do escopo $d$:
$$CC_{\\text{cog}} = \\sum_{i \\in \\text{Decisions}} (1 + \\text{NestingLevel}(i))$$
Cada nível de aninhamento $d$ incrementa a carga cognitiva, refletindo fielmente o esforço humano de rastreamento de estado mental.`,
      latexFormula: 'CC = E - N + 2P, \\quad CC_{\\text{cog}} = \\sum_{i \\in D} (1 + \\text{NestingLevel}_i)'
    },
    {
      title: '2. AST Diff Analysis & Normalização Semântica',
      subtitle: 'Canonicalização de Árvore Sintática e Detecção de Dead Code',
      content: `Para evitar falsos positivos provocados por formatação, comentários ou renomeação de variáveis locais, o analisador constrói a $AST_{\\text{norm}}$ aplicando $\\alpha$-conversion (normalização de identificadores locais para rótulos canônicos).

1. **Semantic Diffing**:
$$D_{\\text{sem}}(AST_{v1}, AST_{v2}) = \\text{CanonicalShape}(AST_{v1}) \\Delta \\text{CanonicalShape}(AST_{v2})$$
Permite mapear alterações reais no fluxo de controle, introdução de blocos 'unsafe' não autorizados ou desvios de tratamento de exceção.

2. **Zero-Dead-Code Graph Reachability**:
Formaliza-se a detecção de código morto como um problema de alcançabilidade de nós em um Call Graph direcionado $G = (V, E)$:
$$R(f) = \\{ v \\in V \\mid \\exists \\text{path}(v_{\\text{entry}} \\to v) \\}$$
onde $V_{\\text{entry}} = \\{ v \\in V \\mid \\text{is\\_exported}(v) \\lor \\text{is\\_entrypoint}(v) \\}$. Vértices com $R(v) = 0$ são classificados como dead code estrito com complexidade $O(V + E)$ via busca em profundidade/largura (DFS/BFS).`,
      latexFormula: '\\text{DeadCode} = \\{ v \\in V \\mid \\nexists \\text{path}(v_{\\text{entry}} \\to v) \\}'
    },
    {
      title: '3. Concorrência Safe-Memory: DAG de Locks & Problema ABA',
      subtitle: 'Garantias Antideadlock e Atenuação de State Churn no Coerência de Cache',
      content: `1. **Invariante de DAG de Locks (Lock Hierarchy)**:
Para prevenir deadlocks em modelos baseados em locks em estados mutáveis compartilhados (ex: 'Arc<Mutex<T>>' em Rust), impõe-se uma ordem parcial estrita sobre os endereços de memória dos mutexes:
$$\\partial L = \\emptyset \\implies \\text{addr}(L_A) < \\text{addr}(L_B) \\quad \\forall \\text{aquisições encadeadas } L_A \\to L_B$$
Se o grafo de dependência de aquisição de locks contiver ciclos, o sistema é rejeitado estaticamente.

2. **Lock-Free CAS & Problema ABA**:
No modelo Lock-Free baseado em Compare-And-Swap (CAS), se um ponteiro troca do endereço $A \\to B \\to A$, o CAS Ingênuo falha ao detectar a mutação intermediária. A mitigação utiliza *Hazard Pointers* ou *Tagged References* (ponteiro de 64 bits + contador de versão incremental de 64 bits):
$$\\text{CAS}(\\&\\text{ptr\\_and\\_version}, (A, v_1), (\\text{new\\_val}, v_2))$$
Garantindo que a alteração de $v_1 \\to v_3$ invalide a substituição e previna corrupção de memória.`,
      latexFormula: '\\text{CAS}((A, v_1) \\to (\\text{new\\_val}, v_2)) \\implies v_{\\text{expected}} == v_{\\text{current}}'
    },
    {
      title: '4. Validação de Domínio Orientada a Tipos e Contratos AST',
      subtitle: "Parse, Don't Validate e Esquema de CI/CD Report",
      content: `Substitui-se a checagem em tempo de execução imperativa pelo padrão *Newtype* e construtores privados que garantem invariantes de tipo com custo zero de abstração (*Zero-Cost Abstractions*):

\`\`\`rust
// Zero-Cost Domain Validation
pub struct ValidatedEmail(String);

impl ValidatedEmail {
    pub fn parse(input: String) -> Result<Self, DomainError> {
        if input.contains('@') && input.len() <= 255 {
            Ok(Self(input))
        } else {
            Err(DomainError::InvalidEmail)
        }
    }
}
\`\`\`

O relatório de lint de CI/CD valida o cumprimento do contrato com o esquema estrito:
'cc_max <= 10', 'cognitive_max <= 7', 'unsafe_blocks == 0' e 'dead_code_count == 0'.`
    }
  ],
  referenceImplementation: {
    filename: 'ast_complexity_analyzer.ts',
    language: 'typescript',
    description: 'Analisador determinístico de complexidade ciclomática e cognitiva, grafo de alcançabilidade e contrato de lint.',
    code: `export interface ASTNode {
  type: string;
  children?: ASTNode[];
  isReturn?: boolean;
  nestingLevel?: number;
}

export interface ASTLintContractReport {
  ccMax: number;
  cognitiveMax: number;
  unsafeBlocks: number;
  deadCodeCount: number;
  passed: boolean;
}

export class ASTComplexityAnalyzer {
  public static calculateCyclomaticComplexity(ast: ASTNode): number {
    let decisionCount = 0;

    const traverse = (node: ASTNode) => {
      if (['IfStatement', 'WhileStatement', 'ForStatement', 'LogicalExpression', 'SwitchCase'].includes(node.type)) {
        decisionCount++;
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    traverse(ast);
    return decisionCount + 1;
  }

  public static calculateCognitiveComplexity(ast: ASTNode): number {
    let score = 0;

    const traverse = (node: ASTNode, currentNesting: number) => {
      const isControl = ['IfStatement', 'WhileStatement', 'ForStatement', 'SwitchCase'].includes(node.type);
      if (isControl) {
        score += 1 + currentNesting;
      }
      if (node.children) {
        node.children.forEach(child => traverse(child, isControl ? currentNesting + 1 : currentNesting));
      }
    };

    traverse(ast, 0);
    return score;
  }

  public static detectUnreachableCode(statements: ASTNode[]): boolean {
    let returnEncountered = false;

    for (const stmt of statements) {
      if (returnEncountered) {
        return true;
      }
      if (stmt.isReturn || stmt.type === 'ReturnStatement') {
        returnEncountered = true;
      }
    }
    return false;
  }

  public static validateLintContract(metrics: {
    ccMax: number;
    cognitiveMax: number;
    unsafeBlocks: number;
    deadCodeCount: number;
  }): ASTLintContractReport {
    const passed =
      metrics.ccMax <= 10 &&
      metrics.cognitiveMax <= 7 &&
      metrics.unsafeBlocks === 0 &&
      metrics.deadCodeCount === 0;

    return {
      ...metrics,
      passed
    };
  }
}
`
  },
  invariants: [
    'Cyclomatic Complexity Bound Invariant: CC = E - N + 2P <= 10 por função atômica.',
    'Cognitive Complexity Bound Invariant: CC_cog <= 7 com penalização de aninhamento 1 + NestingDepth.',
    'Zero-Dead-Code Reachability Invariant: R(v) > 0 a partir de entrypoints públicos no Call Graph G=(V,E).',
    'Lock Hierarchy DAG Invariant: addr(L_A) < addr(L_B) para prevenção estática de deadlocks.',
    'Zero-Cost Type Domain Invariant: Instanciação de tipo protegida por construtor validador no contorno do domínio.',
    'AST Lint Gate Contract: Rejeição no CI/CD se cc_max > 10, cognitive_max > 7, unsafe_blocks > 0 ou dead_code_count > 0.'
  ],
  testSuite: [
    {
      id: 'm4m5-q1',
      number: 1,
      title: '1. Cyclomatic vs Cognitive Divergence e Custo de Carga Mental',
      scenario: "Considere uma função com CC = 4 constituída por um aninhamento linear de 5 blocos 'if' encadeados e negações booleanas complexas.",
      problemStatement: 'Por que a Complexidade Ciclomática (CC) mascara o risco de manutenção e como a Complexidade Cognitiva (CC_cog) quantifica o custo da carga mental do revisor?',
      options: [
        {
          id: 'opt-a',
          text: 'CC conta apenas arcos de branch independentes sem penalizar a profundidade de nesting mental; CC_cog pondera fatorialmente a profundidade de escopo aninhado (1 + NestingDepth), refletindo com precisão o esforço cognitivo do leitor.',
          isCorrect: true,
          explanation: 'Correto. McCabe CC trata 5 ifs planos com a mesma pontuação que 5 ifs aninhados. A Complexidade Cognitiva aplica um incremento de +1 para a estrutura de controle somado ao nível de aninhamento corrente (0 + 1 + 2 + 3...), revelando o custo real de legibilidade.'
        },
        {
          id: 'opt-b',
          text: 'CC mede o número de linhas de código enquanto CC_cog mede a quantidade de variáveis globais.',
          isCorrect: false,
          explanation: 'Incorreto. CC baseia-se na topologia do CFG (E - N + 2P), não em contagem de linhas.'
        },
        {
          id: 'opt-c',
          text: 'CC_cog é calculada multiplicando o número de parâmetros pelo tempo de compilação em milissegundos.',
          isCorrect: false,
          explanation: 'Incorreto. CC_cog é uma métrica puramente estática baseada na estrutura de aninhamento do AST.'
        },
        {
          id: 'opt-d',
          text: 'Não há diferença entre as duas métricas, sendo termos sinônimos.',
          isCorrect: false,
          explanation: 'Incorreto. CC e CC_cog possuem formulações e propósitos totalmente distintos.'
        }
      ],
      expectedInvariant: 'Cognitive Nesting Penalty Invariant vs McCabe Flat Branches',
      detailedInvariantSolution: 'Gabarito oficial: CC conta apenas arcos de branch independentes sem penalizar profundidade de nesting mental; CC_cog pondera fatorialmente a profundidade de escopo aninhado.'
    },
    {
      id: 'm4m5-q2',
      number: 2,
      title: '2. AST Normalization Hash & Alpha Conversion em Microserviços',
      scenario: 'Durante a execução do pipeline de CI/CD, o analisador compara o código refatorado de um microserviço aplicando canonicalização de AST.',
      problemStatement: 'Como a canonicalização de AST ignora renomeação de variáveis locais (alpha conversion) mas detecta alteração de fluxo de controle em diff semântico?',
      options: [
        {
          id: 'opt-a',
          text: 'Alpha conversion renomeia identificadores de ligação sem alterar a estrutura de árvore gramatical de blocos de controle de execução (CFG/AST shape), gerando hash estrutural invariante a naming.',
          isCorrect: true,
          explanation: 'Correto. A normalização substitui nomes locais por símbolos genéricos de escopo ($var_1, $var_2). A forma geométrica da árvore de nós (IfStatement, ReturnStatement, BinaryExpression) permanece idêntica; qualquer mudança em nós de controle altera a topologia da árvore e modifica o hash da AST_norm.'
        },
        {
          id: 'opt-b',
          text: 'Alpha conversion converte todo o código-fonte em um vetor de embeddings de palavras e mede a distância de cosseno.',
          isCorrect: false,
          explanation: 'Incorreto. Alpha conversion é uma transformação simbólica exata em AST, não uma aproximação de embeddings.'
        },
        {
          id: 'opt-c',
          text: 'A canonicalização apaga todos os comandos \'if\' e \'else\' para simplificar a comparação.',
          isCorrect: false,
          explanation: 'Incorreto. Apagar comandos de controle destruiria a capacidade de detectar alterações semânticas.'
        },
        {
          id: 'opt-d',
          text: 'A AST normalizada é gerada executando o código em uma máquina virtual isolada.',
          isCorrect: false,
          explanation: 'Incorreto. É um processo de análise estática pura sem necessidade de execução em tempo de execução.'
        }
      ],
      expectedInvariant: 'Alpha Conversion Structural Hash Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Alpha conversion renomeia identificadores de ligação sem alterar a estrutura de árvore gramatical de blocos de controle de execução (CFG/AST shape), gerando hash estrutural invariante a naming.'
    },
    {
      id: 'm4m5-q3',
      number: 3,
      title: '3. Dead-Code Graph Reachability Algorithm em Call Graphs',
      scenario: 'Um sistema legado possui centenas de funções. O linteador precisa identificar métodos mortos construindo um Call Graph direcionado G=(V,E).',
      problemStatement: 'Formalize o algoritmo de alcançabilidade de dead code em O(V+E) sobre o call graph direcionado G=(V,E) com múltiplos entrypoints.',
      options: [
        {
          id: 'opt-a',
          text: 'Executar DFS/BFS a partir do conjunto de nós com is_entry_point == true; vértices não alcançados (V \\ R(V_entry)) constituem dead-code estrito.',
          isCorrect: true,
          explanation: 'Correto. Coleta-se o conjunto V_entry de funções exportadas/públicas. Realiza-se uma travessia (DFS ou BFS) acumulando o conjunto de nós atingidos R(V_entry). O complemento V \\ R(V_entry) é estritamente inalcançável em tempo de execução.'
        },
        {
          id: 'opt-b',
          text: 'Executar a ordenação topológica e remover os 5 últimos nós da lista.',
          isCorrect: false,
          explanation: 'Incorreto. Os últimos nós na ordenação topológica podem ser funções folhas altamente utilizadas.'
        },
        {
          id: 'opt-c',
          text: 'Somar os ponteiros de memória de cada função e descartar as que possuem endereço ímpar.',
          isCorrect: false,
          explanation: 'Incorreto. O endereço de memória é arbitrário e irrelevante para a alcançabilidade lógica.'
        },
        {
          id: 'opt-d',
          text: 'Inverter todas as arestas E do grafo e executar o algoritmo de Dijkstra com peso negativo.',
          isCorrect: false,
          explanation: 'Incorreto. Dijkstra com pesos negativos é inadequado e desnecessariamente complexo para checagem de alcance unweighted.'
        }
      ],
      expectedInvariant: 'Reachability Complement Dead-Code Invariant: Dead = V \\ Reachable(V_entry)',
      detailedInvariantSolution: 'Gabarito oficial: Executar DFS/BFS a partir do conjunto de nós com is_entry_point == true; vértices não alcançados constituem dead-code estrito.'
    },
    {
      id: 'm4m5-q4',
      number: 4,
      title: '4. Interior Mutability Race Invariant & DAG de Locks Antideadlock',
      scenario: "Dois atores em Rust utilizam 'Arc<Mutex<A>>' e 'Arc<Mutex<B>>'. O Ator 1 adquire L_A e tenta adquirir L_B; simultaneamente o Ator 2 adquire L_B e tenta adquirir L_A.",
      problemStatement: "Por que o encapsulamento em 'Arc<Mutex<T>>' previne race conditions de dados mas pode introduzir deadlocks lógicos, e qual invariante de DAG de locks o previne?",
      options: [
        {
          id: 'opt-a',
          text: 'DAG de locks obrigatória: ordenação global estrita dos endereços de memória de mutex (addr(L_A) < addr(L_B)) para aquisição encadeada, garantindo ausência de ciclos no grafo de dependência de recursos.',
          isCorrect: true,
          explanation: 'Correto. Mutexes garantem exclusão mútua contra Data Races, mas a ordem cruzada L_A -> L_B vs L_B -> L_A gera um ciclo de espera circular. A imposição de uma ordem total estrita baseada no endereço de memória do lock garante que todo agente adquira primeiro o lock de menor endereço, tornando o grafo de locks acíclico (DAG).'
        },
        {
          id: 'opt-b',
          text: 'Invariante de FIFO: a thread mais antiga na fila do sistema operacional sempre quebra o deadlock.',
          isCorrect: false,
          explanation: 'Incorreto. Deadlocks lógicos não são resolvidos por escalonamento FIFO sem preempção/interrupção.'
        },
        {
          id: 'opt-c',
          text: 'Invariante de Mutex duplo: duplicar o buffer de memória do Mutex resolve a disputa.',
          isCorrect: false,
          explanation: 'Incorreto. Duplicar o buffer viola a semântica de exclusão mútua do estado compartilhado.'
        },
        {
          id: 'opt-d',
          text: 'Invariante de Garbage Collection: o coletor de lixo força o release do lock após 10ms.',
          isCorrect: false,
          explanation: 'Incorreto. Rust não possui runtime com garbage collector e locks não expirados causam travamento indefinido.'
        }
      ],
      expectedInvariant: 'Strict Partial Lock Ordering Invariant (Acyclic Lock DAG)',
      detailedInvariantSolution: 'Gabarito oficial: DAG de locks obrigatória: ordenação global estrita dos endereços de memória de mutex (addr(L_A) < addr(L_B)) para aquisição encadeada.'
    },
    {
      id: 'm4m5-q5',
      number: 5,
      title: '5. Lock-Free CAS ABA Mitigation & MESI Cache Coherence State Churn',
      scenario: 'Um desenvolvedor constrói uma fila Lock-Free usando a instrução CAS. Para prevenir o erro ABA, considera o uso de Hazard Pointers ou Tagged Pointers.',
      problemStatement: 'No modelo lock-free baseado em Compare-And-Swap (CAS), explique por que o ponteiro com version stamp / hazard pointer previne o bug ABA e qual o custo de latência do MESI state churn.',
      options: [
        {
          id: 'opt-a',
          text: 'Hazard pointers ou Tagged pointers (pointer + counter 64-bit) evitam que o CAS revalide um endereço reciclado por outra thread intermediária; o custo é o invalidation churn da linha de cache MESI (Shared -> Modified) disparado por gravações atômicas concorrentes.',
          isCorrect: true,
          explanation: 'Correto. O contador de versão garante univalência temporal ((A, v1) != (A, v3)). Contudo, loop em spinning de CAS atômicos causa tráfego intenso de invalidação de linhas de cache (bus invalidation no protocolo MESI/MOESI), reduzindo a largura de banda da memória.'
        },
        {
          id: 'opt-b',
          text: 'Hazard pointers bloqueiam o barramento PCIe e paralisam a CPU por 1 milissegundo a cada CAS.',
          isCorrect: false,
          explanation: 'Incorreto. Hazard pointers operam em memória do usuário sem paralisar o barramento PCIe de hardware.'
        },
        {
          id: 'opt-c',
          text: 'O bug ABA é eliminado convertendo a memória RAM para registradores virtuais.',
          isCorrect: false,
          explanation: 'Incorreto. Registradores virtuais são abstrações de compilação sem efeito na concorrência de memória atômica.'
        },
        {
          id: 'opt-d',
          text: 'Hazard pointers não possuem custo de coerência de cache por utilizarem escrita direta no disco.',
          isCorrect: false,
          explanation: 'Incorreto. Trata-se de estruturas totalmente residentes na RAM e L1/L2/L3 cache.'
        }
      ],
      expectedInvariant: 'Hazard Pointer Monotonic Tag Invariant & MESI Invalidation Overhead',
      detailedInvariantSolution: 'Gabarito oficial: Hazard pointers ou Tagged pointers (pointer + counter 64-bit) evitam que o CAS revalide um endereço reciclado por outra thread intermediária.'
    },
    {
      id: 'm4m5-q6',
      number: 6,
      title: '6. Regra de Guardrail de Code Review baseada em AST (Tree-sitter Rule)',
      scenario: "Projeta-se um linter customizado em Tree-sitter para proibir chamadas de I/O bloqueante (ex: 'std::fs::read') dentro de contextos assíncronos ('tokio::spawn').",
      problemStatement: 'Qual é a regra formal AST-grep / Tree-sitter que detecta esse antipattern que paralisa os worker threads do runtime assíncrono?',
      options: [
        {
          id: 'opt-a',
          text: 'Tree-sitter query match AST pattern (call_expression function: (field_expression) @func (#eq? @func "std::fs::read")) dentro do escopo de (async_insert_block) ou tokio::spawn.',
          isCorrect: true,
          explanation: 'Correto. A consulta Tree-sitter/AST-grep inspeciona o nó call_expression, verifica se o identificador ou expressão de campo coincide com funções bloqueantes de arquivo/rede e levanta violação estática se contido em um bloco ou closure assíncrono.'
        },
        {
          id: 'opt-b',
          text: 'Procurar a string "read" em qualquer linha do arquivo de texto usando regex simples sem árvore sintática.',
          isCorrect: false,
          explanation: 'Incorreto. Regex sem AST gera falsos positivos em nomes de variáveis, comentários e funções síncronas fora de contextos async.'
        },
        {
          id: 'opt-c',
          text: 'Inserir um bloco try / catch ao redor do código em tempo de execução.',
          isCorrect: false,
          explanation: 'Incorreto. try/catch captura exceções operacionais, não previne o bloqueio das worker threads do runtime assíncrono.'
        },
        {
          id: 'opt-d',
          text: 'Executar o programa por 24 horas e analisar os logs de depuração.',
          isCorrect: false,
          explanation: 'Incorreto. Guardrails de revisão de código devem atuar de forma estática determinística antes do merge do código.'
        }
      ],
      expectedInvariant: 'Async Runtime Non-Blocking I/O AST Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Tree-sitter query match AST pattern (call function: (identifier) @func) #eq? @func "read" sob escopo async fn.'
    },
    {
      id: 'm4m5-q7',
      number: 7,
      title: "7. Validação de Domínio Orientada a Tipos (Parse, Don't Validate)",
      scenario: "Em vez de espalhar validações imperativas em tempo de execução ('if email.is_empty() { return Err(...) }'), reescreve-se o modelo de domínio.",
      problemStatement: "Como transformar validação em tempo de execução em invariante de tipo de zero-cost abstraction ('ValidatedEmail(String)') via construtor privado?",
      options: [
        {
          id: 'opt-a',
          text: 'Newtype pattern / private field com constructor validador garantindo que o tipo só instancia se pós-condição for true no tipo construtor, impossibilitando a existência de estados inválidos no restante do sistema.',
          isCorrect: true,
          explanation: 'Correto. O padrão Newtype oculta o campo interno. A única forma de obter uma instância de ValidatedEmail é através do método ValidatedEmail::parse(). As demais funções do sistema passam a aceitar ValidatedEmail diretamente, dispensando re-validações redundantes.'
        },
        {
          id: 'opt-b',
          text: 'Converter todas as strings para inteiros de 64 bits usando funções de hash SHA-256.',
          isCorrect: false,
          explanation: 'Incorreto. O hash perde o valor legível do e-mail e não garante a conformidade com regras de domínio.'
        },
        {
          id: 'opt-c',
          text: "Utilizar a palavra-chave 'any' em TypeScript para permitir qualquer entrada sem erro de compilação.",
          isCorrect: false,
          explanation: "Incorreto. O uso de 'any' destrói completamente a segurança de tipos do sistema."
        },
        {
          id: 'opt-d',
          text: 'Criar um banco de dados relacional para armazenar cada tentativa de validação.',
          isCorrect: false,
          explanation: 'Incorreto. Inserir acesso a banco de dados para validação sintática de tipo destrói a performance e introduz dependência I/O.'
        }
      ],
      expectedInvariant: 'Zero-Cost Type Domain Construction Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Newtype pattern / private field com constructor validador garantindo que o tipo só instancia se pós-condição for true no tipo construtor.'
    },
    {
      id: 'm4m5-q8',
      number: 8,
      title: '8. Risco de Latência Oculta por Async Drop Recursivo Maciço',
      scenario: "Uma aplicação de alto rendimento desaloca uma estrutura de dados gigantesca em memória ('Vec<Box<T>>' com 10 milhões de elementos) ao sair do escopo de um handler assíncrono.",
      problemStatement: 'Qual o risco de latência oculta (tail latency spike) gerado pelo drop assíncrono/recursivo no executor e como mitigá-lo?',
      options: [
        {
          id: 'opt-a',
          text: 'Drop síncrono maciço em async worker thread bloqueia o executor (blocking drop queue); mitigação: offloading de drop para pool de background (tokio::task::spawn_blocking) ou liberação incremental paginada.',
          isCorrect: true,
          explanation: 'Correto. A desalocação de 10M de ponteiros exige milissegundos de travessia e chamadas ao alocador free(). Como a desalocação (drop()) roda na worker thread assíncrona, a thread congela, impedindo o processamento de centenas de outras requisições e gerando picos de p99 latência.'
        },
        {
          id: 'opt-b',
          text: 'O executor assíncrono reinicia o servidor automaticamente sem impacto na latência.',
          isCorrect: false,
          explanation: 'Incorreto. Reiniciar o servidor causa perda de conexões e indisponibilidade.'
        },
        {
          id: 'opt-c',
          text: 'A desalocação não consome tempo de CPU por ser uma operação tratada exclusivamente pelo hardware da placa de rede.',
          isCorrect: false,
          explanation: 'Incorreto. Liberação de memória virtual/heap consome ciclos de relógio do processador e locks no heap manager.'
        },
        {
          id: 'opt-d',
          text: 'Aumentar a memória SWAP da máquina resolve o congelamento da worker thread.',
          isCorrect: false,
          explanation: 'Incorreto. Uso de SWAP reduz a velocidade de I/O em ordens de grandeza, agravando o problema.'
        }
      ],
      expectedInvariant: 'Non-Blocking Async Worker Thread Invariant: Heavy Drop Offloading',
      detailedInvariantSolution: 'Gabarito oficial: Drop síncrono maciço em async worker thread bloqueia o executor (blocking drop queue); mitigação: offloading de drop para pool de background (tokio::task::spawn_blocking).'
    },
    {
      id: 'm4m5-q9',
      number: 9,
      title: '9. Cobertura de Mutação de AST vs. Line Coverage Percentual',
      scenario: "Uma suíte de testes atinge 100% de Line Coverage em um algoritmo de cálculo financeiro. No entanto, o Mutation Testing altera a instrução '+' por '-' na AST e nenhum teste falha.",
      problemStatement: 'Por que a mutação de AST (mutation testing) é superior à line-coverage percentual para certificar a qualidade de testes unitários de invariantes numéricos?',
      options: [
        {
          id: 'opt-a',
          text: 'Line-coverage testa execução de linha, mas mutation testing valida se a asserção do teste falha estritamente quando a lógica do invariante é corrompida, garantindo eficácia das asserções e ausência de testes fracos.',
          isCorrect: true,
          explanation: 'Correto. Executar uma linha de código (Line Coverage) não garante que as asserções do teste verificam os valores corretos (assert!(true) gera 100% de cobertura). Injetar mutantes na AST (trocar >, <, +, -) força a suíte a matar os mutantes; se o mutante sobrevive, a asserção é deficiente.'
        },
        {
          id: 'opt-b',
          text: 'Mutation testing reduz o tempo de execução da suíte de testes em 90%.',
          isCorrect: false,
          explanation: 'Incorreto. Mutation testing re-executa a suíte centenas de vezes para cada mutante, sendo computacionalmente mais intensivo.'
        },
        {
          id: 'opt-c',
          text: 'Line coverage mede a quantidade de erros de compilação em tempo de build.',
          isCorrect: false,
          explanation: 'Incorreto. Line coverage mede apenas o percentual de instruções do bytecode/código executadas durante o teste.'
        },
        {
          id: 'opt-d',
          text: 'Mutation testing é aplicável unicamente a linguagens dinâmicas como Python.',
          isCorrect: false,
          explanation: 'Incorreto. O Teste de Mutação em AST é amplamente utilizado em Rust (cargo-mutants), Java (PITest) e TypeScript (Stryker).'
        }
      ],
      expectedInvariant: 'AST Mutation Testing Assertion Rigor Invariant: Mutant Survival Rate == 0%',
      detailedInvariantSolution: 'Gabarito oficial: Line-coverage testa execução de linha, mas mutation testing valida se a asserção do teste falha estritamente quando a lógica do invariante é corrompida.'
    },
    {
      id: 'm4m5-q10',
      number: 10,
      title: '10. Zero-Mock AST Diff Contract Schema para CI/CD',
      scenario: 'O portão de integração contínua (CI/CD) analisa o relatório JSON emitido pelo linteador de AST do repositório.',
      problemStatement: 'Qual esquema de contrato JSON/Pydantic valida o relatório do scan com bloqueio automático (exit code 1) em caso de violação de invariantes?',
      options: [
        {
          id: 'opt-a',
          text: 'Schema JSON estrito validando métricas agregadas do AST diff scan (cc_max <= 10, cognitive_max <= 7, unsafe_blocks == 0, dead_code_count == 0) com exit code 1 se Delta > 0 em portões bloqueantes.',
          isCorrect: true,
          explanation: 'Correto. O contrato exige a validação estrita de todos os 4 limites operacionais. Qualquer violação (Delta > 0 nos limites permitidos) interrompe a esteira de deployment prevenindo a introdução de débito técnico.'
        },
        {
          id: 'opt-b',
          text: 'Um arquivo CSV contendo os nomes dos autores dos commits do Git.',
          isCorrect: false,
          explanation: 'Incorreto. Nomes de autores não constituem validação técnica de invariantes de código.'
        },
        {
          id: 'opt-c',
          text: 'Permitir qualquer valor desde que o código possua mais de 500 linhas.',
          isCorrect: false,
          explanation: 'Incorreto. Quantidade de linhas não garante qualidade nem segurança de código.'
        },
        {
          id: 'opt-d',
          text: 'Retornar exit code 0 sempre para não interromper os deploys da equipe.',
          isCorrect: false,
          explanation: 'Incorreto. Retornar exit code 0 cego anula a razão de existir do portão de CI/CD.'
        }
      ],
      expectedInvariant: 'Deterministic CI/CD Quality Gate Contract Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Schema JSON estrito validando métricas agregadas do AST diff scan com exit code 1 se Delta > 0 em portões bloqueantes.'
    }
  ]
};

export class ASTComplexityAnalyzer {
  public static calculateCyclomaticComplexity(astNode: any): number {
    let decisionPoints = 0;

    const traverse = (node: any) => {
      if (!node) return;

      if (
        node.type === 'IfStatement' ||
        node.type === 'WhileStatement' ||
        node.type === 'ForStatement' ||
        node.type === 'SwitchCase' ||
        node.type === 'LogicalExpression'
      ) {
        decisionPoints++;
      }

      if (Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    };

    traverse(astNode);
    return decisionPoints + 1;
  }

  public static calculateCognitiveComplexity(astNode: any): number {
    let score = 0;

    const traverse = (node: any, nestingLevel: number) => {
      if (!node) return;

      const isControlStructure =
        node.type === 'IfStatement' ||
        node.type === 'WhileStatement' ||
        node.type === 'ForStatement' ||
        node.type === 'SwitchCase';

      if (isControlStructure) {
        score += 1 + nestingLevel;
      }

      if (Array.isArray(node.children)) {
        node.children.forEach((child: any) =>
          traverse(child, isControlStructure ? nestingLevel + 1 : nestingLevel)
        );
      }
    };

    traverse(astNode, 0);
    return score;
  }

  public static detectUnreachableCode(statements: any[]): boolean {
    if (!Array.isArray(statements)) return false;
    let returnEncountered = false;

    for (const stmt of statements) {
      if (returnEncountered) {
        return true;
      }
      if (stmt && (stmt.isReturn || stmt.type === 'ReturnStatement')) {
        returnEncountered = true;
      }
    }
    return false;
  }

  public static validateLintContract(metrics: {
    ccMax: number;
    cognitiveMax: number;
    unsafeBlocks: number;
    deadCodeCount: number;
  }): { passed: boolean; violations: string[] } {
    const violations: string[] = [];

    if (metrics.ccMax > 10) {
      violations.push(`Complexidade Ciclomática máxima (${metrics.ccMax}) excede o limite de 10.`);
    }
    if (metrics.cognitiveMax > 7) {
      violations.push(`Complexidade Cognitiva máxima (${metrics.cognitiveMax}) excede o limite de 7.`);
    }
    if (metrics.unsafeBlocks > 0) {
      violations.push(`Foram encontrados ${metrics.unsafeBlocks} blocos 'unsafe' não autorizados.`);
    }
    if (metrics.deadCodeCount > 0) {
      violations.push(`Foram encontrados ${metrics.deadCodeCount} nós de código morto (Unreachable AST Nodes).`);
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }
}

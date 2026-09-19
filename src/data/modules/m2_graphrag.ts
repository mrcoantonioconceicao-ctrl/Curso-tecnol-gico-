import { ModuleData } from '../../types';

export const m2GraphRagData: ModuleData = {
  id: 'm2',
  code: 'M2',
  title: 'GraphRAG & RAG Avançado — Recuperação Vetorial, Grafos e ETG',
  block: 'Bloco I: IA, Protocolos e Recuperação',
  summary: 'Mapeamento profundo de RAG Híbrido (Dense + Sparse RRF), Chunking Semântico & Hierárquico (Parent-Child), Knowledge Graph & Detecção de Comunidades (Leiden), Re-Ranking por Cross-Encoder e Grafo de Rastreabilidade de Evidências (ETG) com Invariante de Alucinação Zero.',
  analyticalMatrix: [
    {
      domain: '1. Fundamentos Híbridos (Dense + Sparse) & RRF',
      deterministicBound: 'Reciprocal Rank Fusion Score: RRF(d) = sum_{m in M} 1 / (k + r_m(d)) com k=60. Garante limite determinístico de ordenação.',
      latencyVsConsistency: 'Busca esparsa (BM25/SPLADE) ~2ms + busca densa HNSW (nomic/ada-3) ~15ms. Consistência forte no índice combinado com RRF.',
      securityInvariant: 'Recall@K_hybrid >= max(Recall@K_dense, Recall@K_sparse) + epsilon_min.'
    },
    {
      domain: '2. Chunking Semântico & Hierárquico',
      deterministicBound: 'Projeção de vizinhança cos(e_i, e_{i+1}) < tau_semantic para quebra de fronteira. Parent-Child: Child 128t, Parent 1024t.',
      latencyVsConsistency: 'Custo de fragmentação O(T) na ingestão. Busca ultra-rápida no Child de 128t e injeção do Parent de 1024t semântico no prompt.',
      securityInvariant: 'Invariante de Contiguidade Sintática: tabelas e blocos de código bypassam o threshold vetorial contínuo como nós atômicos indivisíveis.'
    },
    {
      domain: '3. Knowledge Graph & Community Detection',
      deterministicBound: 'Extração via schema restrito Pydantic. Particionamento hierárquico pelo Algoritmo de Leiden maximizando a modularidade Q.',
      latencyVsConsistency: 'Indexação assíncrona O(N log N) do grafo. Leitura O(1) de resumos de comunidades (Level 0..L) para Global GraphRAG.',
      securityInvariant: 'Leiden Connectedness Invariant: todo subgrafo induzido G[C_i] é formalmente garantido como conexo.'
    },
    {
      domain: '4. Re-Ranking & Evidence Traceability Graph (ETG)',
      deterministicBound: 'Cross-Encoder O(N * L_q * L_d) restrito ao top-N do RRF. Grafo ETG exige aresta supported_by para cada proposicao P_k.',
      latencyVsConsistency: 'Cross-Encoder ~8ms por par (SLA budget max N <= 13 para budget de 105ms). ETG traversal O(V+E).',
      securityInvariant: 'Invariante de Alucinação Zero: |{P_k | indegree_supported_by(P_k) == 0}| = 0.'
    }
  ],
  theorySections: [
    {
      title: '1. Fundamentos Híbridos (Dense + Sparse) & Reciprocal Rank Fusion (RRF)',
      subtitle: 'Integração de BM25/SPLADE com Embeddings Vetoriais Densos',
      content: `A recuperação vetorial tradicional (Bi-Encoders densos como nomic-embed ou text-embedding-3) sofre de degradação em buscas lexico-exatas (UUIDs, códigos de erro, identificadores alfanuméricos). A abordagem híbrida combina a recuperação esparsa (BM25 ou SPLADE) com a busca densa.

A fusão das listas de ordenação é realizada de forma determinística via Reciprocal Rank Fusion (RRF):
For d in D:
RRF_score(d) = \\sum_{m \\in M} \\frac{1}{k + r_m(d)}

Onde:
- M é o conjunto de recuperadores (m_dense, m_sparse).
- r_m(d) é o rank (posição 1-indexed) do documento d no recuperador m.
- k é a constante de suavização (padronizada em k=60).

Invariante de Revocação Híbrida:
Recall@K_{hybrid} \\ge \\max(Recall@K_{dense}, Recall@K_{sparse}) + \\epsilon_{min}

A constante k=60 evita que ranks de topo de um único recuperador ruidoso dominem desproporcionalmente a fusão, estabilizando a cauda da distribuição.`,
      latexFormula: 'RRF\\_score(d) = \\sum_{m \\in M} \\frac{1}{k + r_m(d)}, \\quad k=60'
    },
    {
      title: '2. Chunking Semântico & Hierárquico (Parent-Child)',
      subtitle: 'Fragmentação por Similaridade Angular e Preservação de Bloco Estruturado',
      content: `O chunking estático por tamanho de caracter destrói a integridade sintática e semântica de documentos. O Chunking Semântico calcula a similaridade de cosseno entre embeddings de frases adjacentes:
\\cos(\\mathbf{e}_i, \\mathbf{e}_{i+1}) < \\tau_{\text{semantic}} \\implies \\text{Quebra de Bloco}

Contudo, para blocos estruturados (como tabelas Markdown, blocos de código fonte ou esquemas JSON), aplica-se a Invariante de Contiguidade Sintática: estes blocos bypassam o threshold vetorial e são encapsulados como nós atômicos indivisíveis.

No modelo Parent-Child Retrieval:
- Child Chunks (128 tokens): Usados para indexação vetorial densa e re-ranking por Cross-Encoder (alta densidade de sinal).
- Parent Chunks (1024-2048 tokens): Injetados no prompt do LLM para fornecer o contexto semântico completo e evitar fragmentação.`,
      latexFormula: '\\cos(\\mathbf{e}_i, \\mathbf{e}_{i+1}) = \\frac{\\mathbf{e}_i \\cdot \\mathbf{e}_{i+1}}{\\|\\mathbf{e}_i\\| \\|\\mathbf{e}_i\\|+1} < \\tau_{\\text{semantic}}'
    },
    {
      title: '3. Knowledge Graph & Detecção de Comunidades via Algoritmo de Leiden',
      subtitle: 'Particionamento de Grafos de Conhecimento e Global GraphRAG',
      content: `O GraphRAG constrói um Knowledge Graph (KG) através da extração de triplas (Head, Relation, Tail) validadas por esquemas Pydantic estritos.

Para responder a perguntas de escopo global (Global Search / Map-Reduce) sobre todo o corpus, o grafo é particionado em uma hierarquia de comunidades (Level 0..L) usando o Algoritmo de Leiden.

Diferente do Algoritmo de Louvain (que pode criar subcomunidades desconexas e nós mal isolados), o Leiden possui uma fase explicita de refinamento que garante a Invariante de Conectividade de Comunidades:
\\forall C_i \\in \\text{Comunidades}, \\quad G[C_i] \\text{ é formalmente conexo.}

Cada comunidade recebe uma sumarização recursiva (Community Summary) usada para navegação hierárquica em queries de síntese global.`,
      latexFormula: 'Q = \\frac{1}{2m} \\sum_{ij} \\left[ A_{ij} - \\frac{k_i k_j}{2m} \\right] \\delta(c_i, c_j)'
    },
    {
      title: '4. Re-Ranking & Evidence Traceability Graph (ETG)',
      subtitle: 'Cross-Encoders e Grafo de Rastreabilidade com Invariante de Alucinação Zero',
      content: `O re-ranking por Cross-Encoder processa a entrada concatenada [CLS] Query [SEP] Document através de mecanismos de cross-attention completa Q \\times K^V, superando a degradação de isotropia e cones angulares estreitos dos Bi-Encoders.

Como a complexidade é O(N \\cdot L_q \\cdot L_d), o número N de candidatos a re-rankear é rigidamente limitado pelo SLA de latência (ex: N \\le 13 para um budget de 105ms).

O Evidence Traceability Graph (ETG) estabelece um DAG de rastreabilidade entre as proposições geradas P_k e os chunks recuperados C_j. A aresta supported_by exige:
S(q, C_j) \\ge \\theta_{\\text{guard}}

Invariante de Alucinação Zero:
|\\{ P_k \\mid \\text{indegree}_{supported\\_by}(P_k) == 0 \\}| = 0

Qualquer afirmação sem arestas válidas de suporte é rejeitada e sinalizada pelo contrato de verificação O(V+E).`,
      latexFormula: '\\vert\\{ P_k \\mid \\text{indegree}_{supported\\_by}(P_k) == 0 \\}\\vert = 0'
    }
  ],
  referenceImplementation: {
    filename: 'graph_rag_engine.ts',
    language: 'typescript',
    description: 'Motor GraphRAG com RRF, ETG Validation contract O(V+E) e Reordenação U-Shape.',
    code: `export interface ETGClaimNode {
  id: string;
  claimText: string;
  supportedByChunkIds: string[];
}

export interface ETGChunkNode {
  id: string;
  content: string;
  score: number;
}

export class GraphRAGEngine {
  // 1. Reciprocal Rank Fusion (RRF)
  public static computeRRF(
    denseRanks: Map<string, number>,
    sparseRanks: Map<string, number>,
    k: number = 60
  ): Map<string, number> {
    const scores = new Map<string, number>();
    const docIds = new Set([...denseRanks.keys(), ...sparseRanks.keys()]);

    for (const docId of docIds) {
      const rDense = denseRanks.get(docId);
      const rSparse = sparseRanks.get(docId);

      let score = 0;
      if (rDense !== undefined) score += 1 / (k + rDense);
      if (rSparse !== undefined) score += 1 / (k + rSparse);

      scores.set(docId, score);
    }
    return scores;
  }

  // 2. U-Shape Reordering (Mitigação do Lost in the Middle)
  public static uShapeReorder<T>(itemsSortedByRelevance: T[]): T[] {
    const reordered: T[] = new Array(itemsSortedByRelevance.length);
    let left = 0;
    let right = itemsSortedByRelevance.length - 1;

    for (let i = 0; i < itemsSortedByRelevance.length; i++) {
      if (i % 2 === 0) {
        reordered[left++] = itemsSortedByRelevance[i];
      } else {
        reordered[right--] = itemsSortedByRelevance[i];
      }
    }
    return reordered;
  }

  // 3. Contrato de Validação ETG O(V+E) - Zero-Mock Hallucination Invariant
  public static validateETGInvariants(
    claims: ETGClaimNode[],
    retrievedChunks: ETGChunkNode[],
    thetaGuard: number = 0.70
  ): { valid: boolean; ungroundedClaims: string[]; totalNodes: number; totalEdges: number } {
    const validChunkIds = new Set(
      retrievedChunks.filter(c => c.score >= thetaGuard).map(c => c.id)
    );

    const ungroundedClaims: string[] = [];
    let edgeCount = 0;

    for (const claim of claims) {
      let supportedDegree = 0;
      for (const chunkId of claim.supportedByChunkIds) {
        if (validChunkIds.has(chunkId)) {
          supportedDegree++;
          edgeCount++;
        }
      }

      if (supportedDegree === 0) {
        ungroundedClaims.push(claim.id);
      }
    }

    const totalNodes = claims.length + retrievedChunks.length;

    return {
      valid: ungroundedClaims.length === 0,
      ungroundedClaims,
      totalNodes,
      totalEdges: edgeCount
    };
  }
}
`
  },
  invariants: [
    'Invariante de Revocação Híbrida: Recall@K_hybrid >= max(Recall@K_dense, Recall@K_sparse) + epsilon_min.',
    'Invariante de Contiguidade Sintática: Tabelas Markdown e blocos de código são mantidos como nós atômicos indivisíveis.',
    'Invariante de Conectividade de Leiden: Todo subgrafo induzido G[C_i] é formalmente garantido como conexo.',
    'Invariante de Alucinação Zero no ETG: |{P_k | indegree_supported_by(P_k) == 0}| = 0.',
    'Invariante de Pre-Filtering de Segurança: Filtros de permissão/ACL devem ser aplicados rigorosamente antes do cálculo de similaridade K-NN.'
  ],
  testSuite: [
    {
      id: 'm2-q1',
      number: 1,
      title: '1. RRF & Tail Penalty em Valores Altos de k',
      scenario: 'Um engenheiro de busca configura um pipeline híbrido RAG onde o parâmetro de suavização k da Reciprocal Rank Fusion (RRF) é ajustado para k = 1000. Uma busca por um identificador exato (UUID de contrato) retorna rank 1 na busca esparsa BM25, mas rank 200 na busca densa. Outros documentos secundários possuem ranks intermediários (~20-30) em ambos os recuperadores.',
      problemStatement: 'Por que o RRF falha em priorizar o resultado rank 1 de alta precisão (UUID exato via BM25) quando k=1000, e qual a explicação matemática para o efeito na cauda da distribuição?',
      options: [
        {
          id: 'opt-a',
          text: 'Um k muito alto domina o denominador (1/(1000+1) vs 1/(1000+30)), tornando a diferença entre o rank 1 e ranks intermediários insignificante, permitindo que a soma de ranks medíocres em múltiplos recuperadores supere um rank 1 exato.',
          isCorrect: true,
          explanation: 'Correto. Quando k é muito grande, 1/(k + r) aproxima-se de uma constante 1/k. A variação de r de 1 para 30 produz uma diferença ínfima (1/1001 = 0.000999 vs 1/1030 = 0.000970). Assim, a acumulação de ranks medianos ruidosos em múltiplos motores supera a relevância de um rank 1 exato.'
        },
        {
          id: 'opt-b',
          text: 'O parâmetro k = 1000 força o BM25 a converter pontuações TF-IDF em probabilidades gaussianas negativas.',
          isCorrect: false,
          explanation: 'Incorreto. O RRF opera apenas sobre os postos ordinais (ranks), não sobre as pontuações brutas TF-IDF.'
        },
        {
          id: 'opt-c',
          text: 'O valor k=1000 causa estouro de memória no índice HNSW, fazendo o recuperador denso ignorar o UUID.',
          isCorrect: false,
          explanation: 'Incorreto. O RRF é uma técnica de fusão pós-recuperação (post-retrieval ranking fusion) e não afeta a memória do índice HNSW.'
        },
        {
          id: 'opt-d',
          text: 'Para k=1000, o RRF inverte a ordem dos recíprocos, transformando a soma em uma subtração de fatores primos.',
          isCorrect: false,
          explanation: 'Incorreto. A fórmula matemática permanece somatória de recíprocos 1/(k+r).'
        }
      ],
      expectedInvariant: 'RRF Denominator Dominance Invariant: Lim_{k -> inf} [ (1/(k+1)) / (1/(k+r)) ] = 1',
      detailedInvariantSolution: 'Gabarito oficial: k alto domina o denominador, diluindo o valor do rank 1 frente a múltiplos ranks intermediários de recuperadores ruidosos. A constante padrão k=60 mantém o equilíbrio ideal.'
    },
    {
      id: 'm2-q2',
      number: 2,
      title: '2. Degradação de Isotropia e Vantagem Angular do Cross-Encoder',
      scenario: 'Em um espaço vetorial denso de alta dimensão (d=4096), observa-se o colapso de anisotropia: a maioria dos embeddings de documentos está concentrada em um cone angular estreito. Bi-encoders geram falsos positivos por alta similaridade de cosseno entre documentos semanticamente irrelevantes.',
      problemStatement: 'Como o Cross-Encoder mitiga essa degradação de isotropia e elimina falsos positivos?',
      options: [
        {
          id: 'opt-a',
          text: 'Através do mecanismo de cross-attention emparelhada Q x K^V na concatenação [CLS] Q [SEP] D, permitindo atenção interativa token-a-token que bypassa a geometria angular estática e unifacetada do bi-encoder.',
          isCorrect: true,
          explanation: 'Correto. O Cross-Encoder não calcula um vetor único estático para Query e Documento separados. Ele processa todos os tokens juntos no mesmo mecanismo de atenção, capturando interações cruzadas complexas não-lineares indissociáveis da estrutura do texto.'
        },
        {
          id: 'opt-b',
          text: 'O Cross-Encoder projeta os vetores em um espaço de dimensão reduzida d=2 e aplica distância Manhattan.',
          isCorrect: false,
          explanation: 'Incorreto. Cross-Encoders não realizam redução de dimensionalidade estática; operam via Transformer completo.'
        },
        {
          id: 'opt-c',
          text: 'O Cross-Encoder substitui os embeddings por hashing perfeito de termos únicos.',
          isCorrect: false,
          explanation: 'Incorreto. Trata-se de um modelo neural baseado em atenção, não de algoritmo de hashing estático.'
        },
        {
          id: 'opt-d',
          text: 'A isotropia é corrigida pelo Cross-Encoder multiplicando a matriz de covariância por -1.',
          isCorrect: false,
          explanation: 'Incorreto. Afirmação sem fundamento no funcionamento de transformers ou re-rankers.'
        }
      ],
      expectedInvariant: 'Cross-Attention Full Interactive Encoding Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Cross-attention emparelhada Q x K^V bypassa a geometria angular estática unifacetada do bi-encoder, resolvendo o colapso de anisotropia.'
    },
    {
      id: 'm2-q3',
      number: 3,
      title: '3. Markup/Table Boundary Invariant em Chunking Semântico',
      scenario: 'Um chunker semântico utiliza um limiar de similaridade de cosseno de tau=0.85 para dividir documentos ao detectar mudanças de tema. Durante o processamento de uma tabela Markdown contendo métricas financeiras de 20 colunas e 50 linhas, a similaridade entre linhas consecutivas cai para 0.72 devido a transição de categorias.',
      problemStatement: 'Qual a invariante arquitetural obrigatória que impede a fragmentação inadequada linha-a-linha de tabelas e blocos estruturados?',
      options: [
        {
          id: 'opt-a',
          text: 'Invariante de Contiguidade Sintática: blocos estruturados (tabelas/código) são identificados via AST/parser de marcação e bypassam o threshold vetorial contínuo como nós atômicos indivisíveis.',
          isCorrect: true,
          explanation: 'Correto. Estruturas como tabelas Markdown, blocos de código e esquemas JSON possuem dependência contextual rígida intra-bloco. A quebra vetorial cega destruiria a semântica de colunas/cabeçalhos.'
        },
        {
          id: 'opt-b',
          text: 'Normalização L2 das colunas da tabela antes de passar pelo algoritmo de cosseno.',
          isCorrect: false,
          explanation: 'Incorreto. A normalização L2 altera a magnitude do vetor, mas não resolve a quebra de linhas estruturadas.'
        },
        {
          id: 'opt-c',
          text: 'Forçar o parâmetro tau para 0.10 em todo o documento indiscriminadamente.',
          isCorrect: false,
          explanation: 'Incorreto. Reduzir tau globalmente destruiria a precisão do chunking no texto corrido.'
        },
        {
          id: 'opt-d',
          text: 'Converter a tabela em uma imagem PNG e utilizar busca multimodal OCR exclusiva.',
          isCorrect: false,
          explanation: 'Incorreto. Ineficiente e desnecessário para texto Markdown já estruturado.'
        }
      ],
      expectedInvariant: 'Syntactic Contiguity Invariant: StructuredBlock -> AtomicNode',
      detailedInvariantSolution: 'Gabarito oficial: Blocos estruturados (tabelas/código) são tratados como nós atômicos indivisíveis, bypassando o threshold vetorial contínuo.'
    },
    {
      id: 'm2-q4',
      number: 4,
      title: '4. Comparativo de Topologia: Algoritmo de Leiden vs. Louvain',
      scenario: 'Durante o particionamento de um grafo de conhecimento denso corporativo com 100.000 entidades, o algoritmo de Louvain gera comunidades onde nós desconexos são agrupados no mesmo cluster devido ao ganho de modularidade ganancioso.',
      problemStatement: 'Qual a falha topológica do algoritmo de Louvain que forçou a migração arquitetural para o algoritmo de Leiden no GraphRAG?',
      options: [
        {
          id: 'opt-a',
          text: 'Louvain pode produzir comunidades desconexas e nós arbitrariamente mal conectados porque não verifica a conectividade interna durante a fase de agregação; Leiden adiciona uma fase de refinamento com garantia formal de subcomunidades conexas.',
          isCorrect: true,
          explanation: 'Correto. O algoritmo de Leiden corrige a falha clássica de Louvain garantindo que todas as comunidades resultantes sejam subgrafos induzidos formalmente conexos.'
        },
        {
          id: 'opt-b',
          text: 'Louvain tem complexidade O(N^4) enquanto Leiden é O(1).',
          isCorrect: false,
          explanation: 'Incorreto. Leiden não é O(1); ambos possuem complexidade N log N, mas Leiden oferece garantias topológicas superiores.'
        },
        {
          id: 'opt-c',
          text: 'Louvain não suporta arestas com pesos numéricos decimais positivos.',
          isCorrect: false,
          explanation: 'Incorreto. Louvain funciona em grafos ponderados, mas sofre da falha de desconectividade.'
        },
        {
          id: 'opt-d',
          text: 'Louvain exige que o grafo seja uma árvore estrita sem ciclos.',
          isCorrect: false,
          explanation: 'Incorreto. Louvain foi projetado para grafos gerais com ciclos.'
        }
      ],
      expectedInvariant: 'Leiden Connected Subgraph Formal Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Leiden garante a garantia formal de subcomunidades conexas via sua fase de refinamento explícita.'
    },
    {
      id: 'm2-q5',
      number: 5,
      title: '5. Global vs Local Search no GraphRAG',
      scenario: 'Uma equipe de governança realiza a seguinte consulta: "Quais são os 3 maiores riscos de dependência cruzada entre todos os Bounded Contexts da organização?". O sistema executa busca Local Search (k-NN sobre vetores de entidades locais).',
      problemStatement: 'Por que a busca local falha em responder essa consulta de risco sistêmico multi-domínio e qual a vantagem do Community Summary Traversal?',
      options: [
        {
          id: 'opt-a',
          text: 'Local Search restringe-se a k-hops em vizinhanças locais de entidades específicas; Global Search utiliza Map-Reduce sobre sumários hierárquicos abstratos de comunidades (Leiden Level 0..L) sintetizando a visão holística do sistema.',
          isCorrect: true,
          explanation: 'Correto. Perguntas de escopo abrangente/global ("Quais os principais temas/riscos?") não possuem um único ponto de ancoragem de entidade local. Exigem navegação e síntese hierárquica pelas comunidades de Leiden.'
        },
        {
          id: 'opt-b',
          text: 'Local Search consome mais memória GPU que Global Search.',
          isCorrect: false,
          explanation: 'Incorreto. O problema é de capacidade semântica de abstração topológica, não de recurso de memória GPU.'
        },
        {
          id: 'opt-c',
          text: 'Community Summary Traversal desativa a camada de segurança JWT.',
          isCorrect: false,
          explanation: 'Incorreto. Nenhuma relação com autenticação JWT.'
        },
        {
          id: 'opt-d',
          text: 'Global Search converte o grafo em vetores esparsos BM25 sem utilizar o LLM.',
          isCorrect: false,
          explanation: 'Incorreto. Global Search usa o LLM na fase de Map-Reduce sobre os resumos comunitários.'
        }
      ],
      expectedInvariant: 'Global vs Local Traversal Scope Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Local Search restringe-se a k-hops locais; Global Map-Reduce opera sobre sumários hierárquicos abstratos de cluster.'
    },
    {
      id: 'm2-q6',
      number: 6,
      title: '6. SLA de Latência e Cálculo do Budget do Cross-Encoder',
      scenario: 'O SLA end-to-end do pipeline RAG é de 400ms. A medição de infraestrutura indica: geração de embedding da query = 45ms, tempo até o primeiro token do LLM (TTFT) = 250ms, busca vetorial híbrida (HNSW + BM25) = 0ms (paralela/desprezível). O re-ranker Cross-Encoder consome exatamente 8ms por par (Query, Documento).',
      problemStatement: 'Qual é o número máximo teórico N de documentos candidatos que o Cross-Encoder pode processar sem estourar o SLA?',
      options: [
        {
          id: 'opt-a',
          text: 'Budget restante = 400ms - (45ms + 250ms) = 105ms. Numero maximo N = floor(105 / 8) = 13 documentos.',
          isCorrect: true,
          explanation: 'Correto. Tempo total gasto sem o Cross-Encoder = 45 + 250 = 295ms. Saldo para o Cross-Encoder = 400 - 295 = 105ms. Como cada par leva 8ms, N = floor(105 / 8) = 13 candidatos.'
        },
        {
          id: 'opt-b',
          text: 'N = 50 documentos, pois o Cross-Encoder escala logaritmicamente com N.',
          isCorrect: false,
          explanation: 'Incorreto. O Cross-Encoder encadeia N inferências sequenciais ou paralelas limitadas pela GPU. O cálculo exato do budget disponível resulta em N <= 13.'
        },
        {
          id: 'opt-c',
          text: 'N = 100 documentos, considerando otimização assintótica O(1).',
          isCorrect: false,
          explanation: 'Incorreto. Ignora o tempo fixo por par de 8ms.'
        },
        {
          id: 'opt-d',
          text: 'N = 0, pois a busca híbrida consome 100% do SLA.',
          isCorrect: false,
          explanation: 'Incorreto. O saldo de 105ms permite re-rankear 13 documentos.'
        }
      ],
      expectedInvariant: 'Latency SLA Budget Invariant: Sum(t_stages) <= SLA_max',
      detailedInvariantSolution: 'Gabarito oficial: Budget = 400 - 295 = 105ms => 105 / 8 = 13.125 => N <= 13.'
    },
    {
      id: 'm2-q7',
      number: 7,
      title: '7. ETG Boolean Rejection e Condição de Alucinação',
      scenario: 'No Evidence Traceability Graph (ETG), uma proposição P_k foi gerada pela resposta do LLM. O recuperador retornou o chunk C_j. A pontuação de alinhamento com a guardrail é S(q, C_j).',
      problemStatement: 'Formalize a condição booleana rigorosa de rejeição por alucinação para P_k.',
      options: [
        {
          id: 'opt-a',
          text: 'Se not(valid_edge(P_k -> C_j)) onde valid_edge exige S(q, C_j) >= theta_guard, entao indegree_supported_by(P_k) == 0 e P_k e marcado como alucinação e rejeitado.',
          isCorrect: true,
          explanation: 'Correto. A condição para validar uma proposição P_k é possuir pelo menos uma aresta de suporte direcionada proveniente de um chunk C_j com score acima do threshold theta_guard.'
        },
        {
          id: 'opt-b',
          text: 'Se S(q, C_j) < 0, a proposição é marcada como válida mas oculta no UI.',
          isCorrect: false,
          explanation: 'Incorreto. A ausência de suporte válido exige rejeição e sinalização de alucinação.'
        },
        {
          id: 'opt-c',
          text: 'Se indegree == 1, o nó é duplicado até atingir indegree == 2.',
          isCorrect: false,
          explanation: 'Incorreto. Indegree >= 1 é suficiente se a aresta for válida; não há duplicação sintética de nós.'
        },
        {
          id: 'opt-d',
          text: 'A rejeição ocorre se a soma dos comprimentos de texto for menor que 10.',
          isCorrect: false,
          explanation: 'Incorreto. Critério sem base formal no grafo de evidências.'
        }
      ],
      expectedInvariant: 'ETG Grounding Invariant: indegree_supported_by(P_k) > 0',
      detailedInvariantSolution: 'Gabarito oficial: not(valid_edge(P_k -> C_j)) => flag_hallucination(P_k) com S(q, C_j) >= theta_guard.'
    },
    {
      id: 'm2-q8',
      number: 8,
      title: '8. Entity Resolution e Invariante Topológica de Desambiguação',
      scenario: 'Em um grafo de conhecimento obtido de fontes variadas, as entidades "API_Gateway_v1", "api-gateway-v1" e "https://internal.net/api/v1" referem-se ao mesmo componente. Métricas ingênuas de Levenshtein falham em agrupá-las devido a diferenças de delimitadores e URIs.',
      problemStatement: 'Qual a solução e invariante topológica para consolidar essas entidades sem corromper os tipos do grafo?',
      options: [
        {
          id: 'opt-a',
          text: 'Desambiguação via LLM-in-the-loop combinada com Union-Find sobre embeddings normalizados de entidades do mesmo tipo estrito, unificando nós equivalentes no mesmo conjunto disjunto.',
          isCorrect: true,
          explanation: 'Correto. A resolução de entidades (Entity Resolution) combina a similaridade semântica dos vetores de entidade com validação estrita de tipo (p.ex., Componente de Software) usando Union-Find (Disjoint Set Union) para fusão topológica segura.'
        },
        {
          id: 'opt-b',
          text: 'Truncar todas as strings para os primeiros 3 caracteres ("API").',
          isCorrect: false,
          explanation: 'Incorreto. Causa colisões catastróficas agrupando "API_Gateway" e "API_Key".'
        },
        {
          id: 'opt-c',
          text: 'Remover todos os hífens e barras e converter para maiúsculas sem verificação de tipo.',
          isCorrect: false,
          explanation: 'Incorreto. Falha em capturar equivalências semânticas e URIs complexas.'
        },
        {
          id: 'opt-d',
          text: 'Ignorar a desambiguação e duplicar as arestas N vezes.',
          isCorrect: false,
          explanation: 'Incorreto. Fragmenta o grafo e destrói os cálculos de centralidade de comunidade.'
        }
      ],
      expectedInvariant: 'Strict Type Disambiguation Invariant via Union-Find',
      detailedInvariantSolution: 'Gabarito oficial: Requer Entity Disambiguation via LLM-in-the-loop com Union-Find sobre embeddings normalizados + tipo estrito.'
    },
    {
      id: 'm2-q9',
      number: 9,
      title: '9. Context Bleeding / U-Shape e Atenção do LLM',
      scenario: 'Ao injetar 15 parent chunks recuperados (1024 tokens cada) em uma janela de contexto de 8k tokens, o LLM falha em utilizar informações cruciais localizadas nos chunks 7 e 8 (no meio da janela de contexto).',
      problemStatement: 'Qual é este fenômeno de degradação de atenção e qual a contramedida obrigatória de reordenação de contexto?',
      options: [
        {
          id: 'opt-a',
          text: 'Efeito "Lost in the Middle" / U-Shape Attention; contramedida: U-shape reordering, posicionando os parent chunks de maior relevância no início e no final da janela de contexto do prompt.',
          isCorrect: true,
          explanation: 'Correto. Os mecanismos de atenção de LLMs ponderam desproporcionalmente o início (primazia) e o fim (recência) da janela de contexto. A reordenação em U coloca os itens mais relevantes nas extremidades.'
        },
        {
          id: 'opt-b',
          text: 'Efeito Catastrophic Forgetting; contramedida: re-treinar o LLM com QLoRA em tempo de execução.',
          isCorrect: false,
          explanation: 'Incorreto. Catastrophic forgetting ocorre durante fine-tuning, não em tempo de inferência no prompt.'
        },
        {
          id: 'opt-c',
          text: 'Efeito Token Bleeding; contramedida: criptografar o texto do meio com Base64.',
          isCorrect: false,
          explanation: 'Incorreto. Criptografia não auxilia a atenção do modelo de linguagem.'
        },
        {
          id: 'opt-d',
          text: 'Efeito Gradient Vanishing; contramedida: adicionar conexões residuais no texto.',
          isCorrect: false,
          explanation: 'Incorreto. Descreve problema de treinamento de redes profundas, não reordenação de contexto em prompts.'
        }
      ],
      expectedInvariant: 'U-Shape Context Placement Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Mitigação via U-shape reordering (high-relevance parents no topo e fundo do prompt context window).'
    },
    {
      id: 'm2-q10',
      number: 10,
      title: '10. Zero-Mock ETG Validation Contract e Complexidade Algorítmica',
      scenario: 'Um sistema de auditoria em produção executa o contrato `validate_etg_invariants(response_dag, retrieval_subgraph)` para verificar se todas as afirmações do LLM possuem suporte factual.',
      problemStatement: 'Qual a complexidade de tempo do algoritmo de validação em termos de V (nós de afirmação + chunks) e E (arestas supported_by) e por que ele é O(V+E)?',
      options: [
        {
          id: 'opt-a',
          text: 'O(V+E): O contrato executa travessia BFS/DFS linear verificando se for all p in claims, exists c in retrieved_chunks com edge(p, c) e weight(p, c) >= theta_guard em tempo proporcional ao número de vértices e arestas.',
          isCorrect: true,
          explanation: 'Correto. A validação de integridade do DAG de evidências realiza checagem de grau de entrada e pesos de arestas em uma única passagem topológica O(V+E).'
        },
        {
          id: 'opt-b',
          text: 'O(V^3) devido à necessidade de inversão de matrizes de adjacência.',
          isCorrect: false,
          explanation: 'Incorreto. Não requer multiplicação de matrizes nem inversão; é uma verificação de conectividade em DAG.'
        },
        {
          id: 'opt-c',
          text: 'O(2^V) por ser um problema NP-Completo de caixeiro viajante.',
          isCorrect: false,
          explanation: 'Incorreto. Checagem de arestas de suporte em um DAG é um problema de tempo linear O(V+E).'
        },
        {
          id: 'opt-d',
          text: 'O(E log V) devido à ordenação QuickSort de todas as arestas a cada nó.',
          isCorrect: false,
          explanation: 'Incorreto. O conjunto de chunks válidos é buscado via LookUp O(1) com HashSet, resultando em O(V+E).'
        }
      ],
      expectedInvariant: 'Linear Graph Validation Contract Invariant O(V+E)',
      detailedInvariantSolution: 'Gabarito oficial: BFS/DFS O(V+E) verificando for all p in claims, exists c in retrieved_chunks, edge(p, c) and weight(p, c) >= theta_guard.'
    }
  ]
};

export class GraphRAGEngine {
  public static computeRRF(
    denseRanks: Map<string, number>,
    sparseRanks: Map<string, number>,
    k: number = 60
  ): Map<string, number> {
    const scores = new Map<string, number>();
    const docIds = new Set([...denseRanks.keys(), ...sparseRanks.keys()]);

    for (const docId of docIds) {
      const rDense = denseRanks.get(docId);
      const rSparse = sparseRanks.get(docId);

      let score = 0;
      if (rDense !== undefined) score += 1 / (k + rDense);
      if (rSparse !== undefined) score += 1 / (k + rSparse);

      scores.set(docId, score);
    }
    return scores;
  }
}

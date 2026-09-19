import { ModuleData } from '../../types';

export const m3FinetuningData: ModuleData = {
  id: 'm3',
  code: 'M3',
  title: 'Fine-Tuning & Adaptação — PEFT (LoRA/DoRA/QLoRA), Quantização (AWQ/GPTQ) e Alinhamento DPO/ORPO',
  block: 'Bloco I: IA, Protocolos e Recuperação',
  summary: 'Mecanismo matemático rigoroso de adaptação de baixo posto (LoRA, DoRA e QLoRA), quantização pós-treinamento com preservação de ativação (AWQ) e Hessian (GPTQ), alinhamento direto de preferências (DPO/ORPO) e salvaguardas contra esquecimento catastrófico.',
  analyticalMatrix: [
    {
      domain: '1. PEFT: LoRA, DoRA e QLoRA',
      deterministicBound: 'LoRA: W_new = W_0 + (alpha / r) * B * A. DoRA: W = m * (V + Delta V) / ||V + Delta V||_c. QLoRA: NormalFloat4 (NF4) + Double Quantization + Paged Optimizers.',
      latencyVsConsistency: 'Zero latência adicional após fusão W_fused. Economia de VRAM de até 75% em QLoRA com picos contidos via Unified Memory.',
      securityInvariant: 'RAM_peak <= 1.2 * VRAM_model_base + buffer_act. Preservação estrita da estabilidade de gradiente em FP32/BF16 para adaptadores A e B.'
    },
    {
      domain: '2. Quantização Pós-Treinamento (AWQ / GPTQ)',
      deterministicBound: 'AWQ: Proteção de 1% de pesos salientes com escala por canal s baseada em max(|X_i|). GPTQ: Min_W ||WX - W_tilde X||_2^2 via inverso da Hessiana H^{-1}.',
      latencyVsConsistency: 'Redução de 50% em VRAM. Acelera inferência autoregressiva (memory bandwidth bound) ao reduzir transferência de bytes do KV-cache e matriz de pesos por token.',
      securityInvariant: 'Erro de quantização compensado por coluna na ordem inversa da eliminação de Cholesky sem degradação de perplexidade.'
    },
    {
      domain: '3. Alinhamento de Preferência (DPO / ORPO)',
      deterministicBound: 'DPO: L_DPO = -E [ log sigma( beta * log(pi_theta/pi_ref)_w - beta * log(pi_theta/pi_ref)_l ) ]. ORPO: L_ORPO = L_SFT + lambda * L_OddsRatio sem pi_ref.',
      latencyVsConsistency: 'DPO elimina o Reward Model do PPO (2x mais rápido). ORPO economiza 50% de VRAM ao dispensar pi_ref inteiramente.',
      securityInvariant: 'Cancelamento estrito da função de partição Z(x) invariante à entrada no quociente de verossimilhança.'
    },
    {
      domain: '4. Regressão de Competência (Zero-Degradation Invariant)',
      deterministicBound: 'Validação estatística CI/CD: p-value(t_paired(scores_post, scores_pre)) >= 0.05 e Delta_mean >= -epsilon_delta em benchmarks de raciocínio genérico.',
      latencyVsConsistency: 'Portão de promoção automatizado em CI/CD prevenindo degradação de capacidade geral antes do deploy de adaptadores.',
      securityInvariant: 'Invariante de Catastrophic Forgetting: |Score_pre - Score_post| <= 0.02 em testes de sanidade fora de domínio.'
    }
  ],
  theorySections: [
    {
      title: '1. Parameter-Efficient Fine-Tuning: LoRA, DoRA e QLoRA',
      subtitle: 'Decomposição de Posto, Desacoplamento Magnitudinal e Quantização NF4',
      content: `A adaptação de modelos de linguagem de grande escala através do fine-tuning completo (Full Fine-Tuning) exige o armazenamento de gradientes e estados do otimizador para todos os parâmetros $W_0 \\in \\mathbb{R}^{d \\times k}$.

1. **LoRA (Low-Rank Adaptation)**:
Fatora a atualização de peso $\\Delta W$ em duas matrizes de baixo posto:
$$W_{\\text{new}} = W_0 + \\Delta W = W_0 + \\frac{\\alpha}{r} B A$$
onde $B \\in \\mathbb{R}^{d \\times r}$ (inicializada com zeros) e $A \\in \\mathbb{R}^{r \\times k}$ (inicializada com distribuição Gaussiana).

2. **DoRA (Weight-Decomposed Low-Rank Adaptation)**:
O LoRA puro impõe uma limitação: a magnitude escalar e a direção dos vetores de peso variam de forma fortemente acoplada. O DoRA decompõe explicitamente o vetor de peso em magnitude $m \\in \\mathbb{R}^{1 \\times k}$ e direção $V \\in \\mathbb{R}^{d \\times k}$:
$$W = m \\cdot \\frac{V + \\Delta V}{\\Vert V + \\Delta V \\Vert_c}$$
onde $\\Delta V = \\frac{\\alpha}{r} B A$. Essa decomposição previne o travamento direcional nas épocas iniciais de treinamento quando $B A \\approx 0$.

3. **QLoRA (Quantized LoRA)**:
Combina quantização NormalFloat4 (NF4) para $W_0$, Dupla Quantização (Double Quantization das constantes de escala) e Paged Optimizers (memória unificada CPU/GPU):
$$\\text{RAM}_{\\text{peak}} \\le 1.2 \\cdot \\text{VRAM}_{\\text{model\\_base}} + \\text{buffer}_{\\text{act}}$$`,
      latexFormula: 'W = m \\cdot \\frac{V + \\frac{\\alpha}{r} B A}{\\Vert V + \\frac{\\alpha}{r} B A \\Vert_c}'
    },
    {
      title: '2. Quantização Pós-Treinamento: AWQ & GPTQ',
      subtitle: 'Preservação de Ativações Salientes e Compensação por Inverso da Hessiana',
      content: `A quantização para 4 bits reduz o uso de VRAM em 50%, transicionando a inferência autoregressiva de um gargalo computacional (*compute-bound*) para um gargalo de largura de banda de memória (*memory bandwidth bound*).

1. **AWQ (Activation-aware Weight Quantization)**:
Observa que nem todos os pesos contribuem igualmente para o desempenho do LLM. Os 1% de pesos associados a canais de ativação de maior magnitude $\\max(|X_i|)$ contêm a maior parte da capacidade de raciocínio. O AWQ aplica proteção de escala por canal:
$$W' = W \\cdot S, \\quad X' = S^{-1} \\cdot X$$
sem exigir a inversão explícita da matriz Hessian $H = X^T X$.

2. **GPTQ (Optimal Brain Surgeon Approximation)**:
Aproxima a minimização do erro quadrático médio de reconstrução das ativações de saída por expansão de Taylor de segunda ordem:
$$\\min_W \\Vert W X - \\tilde{W} X \\Vert_2^2$$
Ao quantizar a coluna $i$, ajusta os pesos restantes não quantizados $W[:, i:]$ via compensação de erro baseada no inverso da diagonal da Hessiana:
$$\\Delta W = - \\frac{q_{\\text{error}}}{[H^{-1}]_{ii}} \\cdot H^{-1}[:, i]$$
A computação é otimizada em blocos O(1) usando a decomposição de Cholesky da Hessiana.`,
      latexFormula: '\\Delta W = - \\frac{w_i - Q(w_i)}{[H^{-1}]_{ii}} \\cdot H^{-1}_{:, i}'
    },
    {
      title: '3. Alinhamento de Preferência: DPO & ORPO',
      subtitle: 'Otimização sem Reward Model e Penalidade de Odds-Ratio',
      content: `1. **DPO (Direct Preference Optimization)**:
O DPO elimina a necessidade de treinar um Reward Model e de aplicar PPO instável. Através de uma reparametrização analítica, expressa a recompensa $r(x, y)$ em função da política $\\pi_\\theta$ e da política de referência $\\pi_{\\text{ref}}$:
$$r(x, y) = \\beta \\log \\frac{\\pi_\\theta(y \\vert x)}{\\pi_{\\text{ref}}(y \\vert x)}$$
Substituindo na perda logística do modelo Bradley-Terry:
$$\\mathcal{L}_{\\text{DPO}}(\\pi_\\theta; \\pi_{\\text{ref}}) = -\\mathbb{E}_{(x, y_w, y_l)} \\left[ \\log \\sigma \\left( \\beta \\log \\frac{\\pi_\\theta(y_w\\vert x)}{\\pi_{\\text{ref}}(y_w\\vert x)} - \\beta \\log \\frac{\\pi_\\theta(y_l\\vert x)}{\\pi_{\\text{ref}}(y_l\\vert x)} \\right) \\right]$$
O termo de partição global $Z(x) = \\sum_y \\pi_{\\text{ref}}(y \\vert x) \\exp(\\frac{1}{\\beta} r(x, y))$ cancela-se estritamente no quociente $\\frac{\\pi_\\theta(y_w \\vert x)}{\\pi_\\theta(y_l \\vert x)}$.

2. **ORPO (Odds Ratio Preference Optimization)**:
O ORPO realiza o alinhamento monolítico combinando a perda SFT (Negative Log-Likelihood) com uma penalidade de Odds-Ratio sem necessitar de modelo de referência separado:
$$\\mathcal{L}_{\\text{ORPO}} = \\mathcal{L}_{\\text{SFT}} + \\lambda \\cdot \\mathcal{L}_{\\text{OR}}$$
$$\\text{Odds}(y \\vert x) = \\frac{\\pi_\\theta(y \\vert x)}{1 - \\pi_\\theta(y \\vert x)}, \\quad \\mathcal{L}_{\\text{OR}} = - \\log \\sigma \\left( \\log \\frac{\\text{Odds}(y_w \\vert x)}{\\text{Odds}(y_l \\vert x)} \\right)$$`,
      latexFormula: '\\mathcal{L}_{\\text{DPO}} = -\\mathbb{E} \\left[ \\log \\sigma \\left( \\beta \\log \\frac{\\pi_\\theta(y_w\\vert x)}{\\pi_{\\text{ref}}(y_w\\vert x)} - \\beta \\log \\frac{\\pi_\\theta(y_l\\vert x)}{\\pi_{\\text{ref}}(y_l\\vert x)} \\right) \\right]'
    },
    {
      title: '4. Benchmark de Regressão de Competência e Contrato de Artefato',
      subtitle: 'Zero-Degradation Invariant e Gate de Promoção CI/CD',
      content: `Durante o fine-tuning especializado em domínios estritos (código, finanças, medicina), o modelo corre o risco de sofrer Esquecimento Catastrófico (*Catastrophic Forgetting*).

Invariante de Regressão Zero:
$$\\vert \\text{Score}_{\\text{pre}} - \\text{Score}_{\\text{post}} \\vert \\le 0.02$$
medido em benchmarks genéricos de raciocínio (MMLU, GSM8K, HumanEval).

O portão de integração contínua (CI/CD) exige validação estatística formal via Paired t-test ou Wilcoxon signed-rank:
$$\\text{p-value}(t_{\\text{paired}}(\\text{scores}_{\\text{post}}, \\text{scores}_{\\text{pre}})) \\ge 0.05 \\quad \\land \\quad \\Delta \\text{mean} \\ge -\\epsilon_{\\delta}$$

O artefato aprovado deve emitir um contrato reprodutível contendo o hash do modelo base, parâmetros de escala, norma Frobenius da atualização e hash SHA256 do adaptador.`
    }
  ],
  referenceImplementation: {
    filename: 'lora_math_calculator.ts',
    language: 'typescript',
    description: 'Calculadora determinística de parâmetros LoRA, DoRA e contrato de verificação de artefato.',
    code: `export interface LoRAGeometry {
  d: number; // Dimensão de entrada
  k: number; // Dimensão de saída
  r: number; // Posto (rank)
  alpha: number; // Fator de escala
}

export interface AdapterArtifactContract {
  baseModelSha256: string;
  adapterHash: string;
  loraAlpha: number;
  rank: number;
  deltaNormFrobenius: number;
  tauMax: number;
}

export class LoRACalculator {
  public static calculateParams(geom: LoRAGeometry): {
    originalParams: number;
    loraParams: number;
    reductionFactor: number;
    scaleRatio: number;
  } {
    const d = geom.d;
    const k = geom.k;
    const r = geom.r;
    const alpha = geom.alpha;

    const originalParams = d * k;
    const loraParams = r * (d + k);
    const reductionFactor = originalParams / Math.max(loraParams, 1);
    const scaleRatio = alpha / Math.max(r, 1);

    return {
      originalParams,
      loraParams,
      reductionFactor,
      scaleRatio
    };
  }

  public static validateArtifactContract(contract: AdapterArtifactContract): {
    valid: boolean;
    reason?: string;
  } {
    if (contract.deltaNormFrobenius > contract.tauMax) {
      return {
        valid: false,
        reason: \`Norma Frobenius Delta W (\${contract.deltaNormFrobenius.toFixed(4)}) excede o limite estipulado tauMax (\${contract.tauMax}). Risk of catastrophic drift.\`
      };
    }
    if (!contract.baseModelSha256 || contract.baseModelSha256.length < 16) {
      return { valid: false, reason: 'Hash do modelo base ausente ou inválido.' };
    }
    return { valid: true };
  }
}
`
  },
  invariants: [
    'LoRA Rank Bottleneck Invariant: Atualizações com r << d_model são restritas ao subespaço projetado Span(B), prevenindo desalinhamento global.',
    'DoRA Magnitude-Direction Invariant: W = m * (V + Delta V) / ||V + Delta V||_c desacopla escala de orientação angular.',
    'QLoRA Peak Memory Invariant: RAM_peak <= 1.2 * VRAM_model_base + buffer_act via NF4 + Double Quantization + Paged Memory.',
    'AWQ Salient Weight Invariant: Preserva os 1% de pesos com maiores ativações max(|X_i|) protegidos por escala por canal.',
    'DPO Partition Cancellation Invariant: Z(x) cancela-se estritamente no quociente de verossimilhanças sem necessidade de Reward Model.',
    'Zero-Degradation Invariant: |Score_pre - Score_post| <= 0.02 em MMLU/GSM8K com p-value >= 0.05 no teste pareado.'
  ],
  testSuite: [
    {
      id: 'm3-q1',
      number: 1,
      title: '1. LoRA Rank Bottleneck e Restrição do Subespaço Vetorial',
      scenario: 'Um engenheiro de ML aumenta o posto do LoRA de r=64 para r=512 em uma camada de atenção de dimensão 4096 x 4096, esperando obter uma expressividade idêntica ao fine-tuning pleno (Full Fine-Tuning).',
      problemStatement: 'Por que aumentar r para 512 não equivale matematicamente ao fine-tuning pleno e qual restrição de subespaço vetorial se impõe?',
      options: [
        {
          id: 'opt-a',
          text: 'Mesmo com r=512, o espaço de atualização Delta W permanece restrito ao subespaço de projeção Span(B) e a otimização por gradiente estocástico sobre a fatoração B * A sofre de overfitting de subespaço e problemas de ilha de convergência sem a atualização da base completa ortogonal.',
          isCorrect: true,
          explanation: 'Correto. A fatoração Delta W = (alpha/r) B A impõe uma trajetória de gradiente restrita ao produto de duas matrizes de baixo posto. Além da limitação de rank maximo 512 < 4096, a dinâmica de otimização estocástica nos fatores A e B induz um subespaço de busca diferente da atualização matricial densa sem fatoração.'
        },
        {
          id: 'opt-b',
          text: 'Com r=512, o PyTorch desativa automaticamente a aceleração CUDA e força a execução em float16.',
          isCorrect: false,
          explanation: 'Incorreto. O compilador PyTorch executa qualquer rank suportado pela GPU sem desativar a CUDA.'
        },
        {
          id: 'opt-c',
          text: 'O valor r=512 força a matriz A a se tornar uma matriz identidade de dimensão 4096.',
          isCorrect: false,
          explanation: 'Incorreto. A matriz A tem dimensão 512 x 4096, não podendo ser matriz identidade.'
        },
        {
          id: 'opt-d',
          text: 'O aumento de r altera a arquitetura de atenção de Multi-Head para Grouped-Query Attention.',
          isCorrect: false,
          explanation: 'Incorreto. A estrutura das cabeças de atenção não é modificada pelos adaptadores LoRA.'
        }
      ],
      expectedInvariant: 'LoRA Subspace Optimization Invariant: Rank Bottleneck & Factorized Gradient Dynamics',
      detailedInvariantSolution: 'Gabarito oficial: r=512 aproxima rank pleno mas o gargalo de otimização de gradiente estocástico e overfitting de subespaço de projeção limitam a expressividade sem atualização de base completa de projeção ortogonal.'
    },
    {
      id: 'm3-q2',
      number: 2,
      title: '2. DoRA Directional Decomposing e Magnitude Uncoupling',
      scenario: 'Durante as primeiras épocas de treinamento com LoRA tradicional, observa-se que o produto B * A inicia próximo de zero, resultando em travamento do ganho direcional dos vetores de peso.',
      problemStatement: 'Como a decomposição de magnitude m em DoRA previne esse travamento direcional que ocorre quando B * A approx 0?',
      options: [
        {
          id: 'opt-a',
          text: 'DoRA desacopla a variação de magnitude escalar m da escala angular do vetor direcional V + Delta V, permitindo que a direção se ajuste livremente na norma unitária sem depender da magnitude escalar conjugada m.',
          isCorrect: true,
          explanation: 'Correto. Na formulação W = m * (V + Delta V) / ||V + Delta V||_c, o vetor de magnitude m é otimizado independentemente. Isso permite atualizações direcionais puras mesmo quando a magnitude e a norma da atualização B A são muito pequenas.'
        },
        {
          id: 'opt-b',
          text: 'DoRA multiplica o gradiente do otimizador pela constante de Euler e.',
          isCorrect: false,
          explanation: 'Incorreto. DoRA utiliza reparametrização de norma de pesos, não multiplicação por constante e.'
        },
        {
          id: 'opt-c',
          text: 'DoRA descarta a matriz B e treina apenas a norma L1 da matriz A.',
          isCorrect: false,
          explanation: 'Incorreto. DoRA mantém ambas as matrizes A e B para atualizar a componente de direção Delta V.'
        },
        {
          id: 'opt-d',
          text: 'DoRA força os pesos base a se tornarem inteiros de 8 bits.',
          isCorrect: false,
          explanation: 'Incorreto. A decomposição de magnitude e direção independe da quantização dos pesos.'
        }
      ],
      expectedInvariant: 'DoRA Magnitude-Direction Uncoupling Invariant',
      detailedInvariantSolution: 'Gabarito oficial: DoRA desacopla variação de magnitude de escala angular, permitindo que a direção se ajuste livremente sem depender da magnitude escalar conjugada m.'
    },
    {
      id: 'm3-q3',
      number: 3,
      title: '3. NF4 Quantization & Information Preservation',
      scenario: 'Ao aplicar quantização em modelos de linguagem pré-treinados, compara-se o esquema NormalFloat4 (NF4) com a quantização inteira uniforme INT4.',
      problemStatement: 'Em QLoRA, por que a quantização NormalFloat4 (NF4) é quantitativamente superior a INT4 uniform-quantization para pesos de LLMs?',
      options: [
        {
          id: 'opt-a',
          text: 'NF4 é uma quantização não-uniforme otimizada para os quantis da distribuição normal padrão empírica dos pesos de LLM N(0, sigma^2), minimizando o erro médio quadrático (MSE) por bucket comparado à quantização linear 4-bit uniforme.',
          isCorrect: true,
          explanation: 'Correto. Os pesos pré-treinados de redes neurais profundas concentram-se fortemente em torno de zero com distribuição Gaussiana. O NF4 divide o intervalo em 16 níveis discretos com probabilidades de ocorrência idênticas sob a curva normal, maximizando a entropia de informação por bit.'
        },
        {
          id: 'opt-b',
          text: 'NF4 armazena os pesos em formato hexadecimal com 2 bits por peso.',
          isCorrect: false,
          explanation: 'Incorreto. Tanto NF4 quanto INT4 utilizam exatamente 4 bits por parâmetro.'
        },
        {
          id: 'opt-c',
          text: 'INT4 introduz ruído térmico na memória VRAM da placa de vídeo.',
          isCorrect: false,
          explanation: 'Incorreto. Ruído térmico é fenômeno físico de hardware, não uma propriedade do algoritmo INT4.'
        },
        {
          id: 'opt-d',
          text: 'NF4 permite que os gradientes sejam calculados sem necessidade de backward pass.',
          isCorrect: false,
          explanation: 'Incorreto. O backward pass continua sendo executado normalmente sobre os adaptadores FP32/BF16.'
        }
      ],
      expectedInvariant: 'Quantile Optimal Quantization Invariant (NF4)',
      detailedInvariantSolution: 'Gabarito oficial: NF4 é quantização não-uniforme otimizada para quantis da distribuição normal padrão empírica dos pesos de LLM, minimizando erro MSE por bucket comparado a quantização linear 4-bit uniforme.'
    },
    {
      id: 'm3-q4',
      number: 4,
      title: '4. AWQ Salient Weight Selection via Activation Calibration',
      scenario: 'A quantização AWQ (Activation-aware Weight Quantization) precisa identificar os 1% de pesos mais críticos do modelo para protegê-los de erros de quantização.',
      problemStatement: 'Como a calibração de AWQ identifica esses 1% de pesos salientes sem exigir o cálculo explícito do autovetor dominante da matriz Hessian H = X^T X?',
      options: [
        {
          id: 'opt-a',
          text: 'AWQ usa métrica baseada em max(|X_i|) da magnitude das ativações do conjunto de calibração para aplicar escalonamento por canal W * s, protegendo diretamente os pesos correspondentes aos canais de alta ativação.',
          isCorrect: true,
          explanation: 'Correto. AWQ observa que a importância dos pesos está fortemente correlacionada com a magnitude das ativações de entrada X. Protegendo os canais onde max(|X_i|) é elevado via escala por canal s, evita a pesada computação da matriz Hessian H = X^T X.'
        },
        {
          id: 'opt-b',
          text: 'AWQ executa 1000 repetições de Monte Carlo para encontrar pesos com valores numéricos pares.',
          isCorrect: false,
          explanation: 'Incorreto. A seleção é fundamentada no valor absoluto das ativações de calibração max(|X_i|).'
        },
        {
          id: 'opt-c',
          text: 'AWQ consulta uma tabela de hashes precomputada pelo fabricante do chip.',
          isCorrect: false,
          explanation: 'Incorreto. É um processo dinâmico de calibração baseado no dataset do usuário.'
        },
        {
          id: 'opt-d',
          text: 'AWQ seleciona aleatoriamente 1% dos pesos usando um gerador de números pseudoaleatórios.',
          isCorrect: false,
          explanation: 'Incorreto. A seleção aleatória destruiria a precisão ao ignorar a saliência de ativações.'
        }
      ],
      expectedInvariant: 'Activation Magnitude Salience Invariant in AWQ',
      detailedInvariantSolution: 'Gabarito oficial: AWQ usa métrica baseada em max(|X_i|) de ativação de calibração para escalar pesos correspondentes W * s, protegendo canais de alta ativação.'
    },
    {
      id: 'm3-q5',
      number: 5,
      title: '5. GPTQ Optimal Brain Surgeon Approximation & Hessian Inverse',
      scenario: 'O algoritmo GPTQ quantiza colunas de peso sequencialmente e precisa ajustar as colunas restantes para minimizar a propagação do erro de quantização no sinal de saída.',
      problemStatement: 'Explique por que o erro de acumulação de quantização em GPTQ exige o uso de q_error / [H^{-1}]_{ii} por coluna processada na ordem de eliminação.',
      options: [
        {
          id: 'opt-a',
          text: 'A atualização de GPTQ ajusta os pesos restantes W[:, i:] via compensação de erro baseada no inverso da diagonal da Hessiana invertida H^{-1} para compensar a distorção introduzida pela quantização da coluna i sem provocar propagação em cascata.',
          isCorrect: true,
          explanation: 'Correto. Derivado do principio Optimal Brain Surgeon, a compensação Delta W = - (q_error / [H^{-1}]_{ii}) * H^{-1}[:, i] garante a minimização do erro quadrático de saída E = ||WX - W_tilde X||_2^2 a cada coluna quantizada.'
        },
        {
          id: 'opt-b',
          text: 'O inverso da Hessiana é usado para converter a matriz de pesos em uma matriz de rotação ortogonal.',
          isCorrect: false,
          explanation: 'Incorreto. Não se trata de rotação ortogonal, mas de compensação de segunda ordem do erro de quantização.'
        },
        {
          id: 'opt-c',
          text: 'O termo [H^{-1}]_{ii} serve unicamente para truncar os valores negativos para zero.',
          isCorrect: false,
          explanation: 'Incorreto. Trata-se do elemento diagonal da Hessiana invertida, atuando como fator de escala de curvatura.'
        },
        {
          id: 'opt-d',
          text: 'GPTQ exige essa compensação porque não utiliza o compilador Triton.',
          isCorrect: false,
          explanation: 'Incorreto. É um fundamento matemático de otimização de segunda ordem independentemente do kernel de execução.'
        }
      ],
      expectedInvariant: 'Optimal Brain Surgeon Hessian Compensation Invariant (GPTQ)',
      detailedInvariantSolution: 'Gabarito oficial: A atualização de GPTQ ajusta os pesos restantes W[:, i:] via compensação de erro baseada no inverso da diagonal da hessiana invertida para evitar propagação em cascata de erro de quantização.'
    },
    {
      id: 'm3-q6',
      number: 6,
      title: '6. DPO Partition Function Bypass Derivation',
      scenario: 'Na derivação do Direct Preference Optimization (DPO), reparametriza-se a função de recompensa r(x, y) = beta * log(pi_theta(y|x) / pi_ref(y|x)) + beta * log Z(x).',
      problemStatement: 'Derive intuitivamente como o DPO remove o termo de partição Z(x) da RLHF tradicional sem violar o teorema de Bayes da política ótima.',
      options: [
        {
          id: 'opt-a',
          text: 'O quociente de probabilidades pi_theta / pi_ref ao subtrair a recompensa implícita do ganhador y_w e do perdedor y_l r(x, y_w) - r(x, y_l) cancela estritamente o termo log Z(x) por ser invariante em relação à resposta y no denominador global da família Gibbs/Boltzmann.',
          isCorrect: true,
          explanation: 'Correto. Como Z(x) depende apenas do prompt x (Z(x) = sum_y pi_ref(y|x) exp(r(x,y)/beta)), na diferença r(x, y_w) - r(x, y_l) = beta * [ log(pi_theta(y_w|x)/pi_ref(y_w|x)) + log Z(x) - log(pi_theta(y_l|x)/pi_ref(y_l|x)) - log Z(x) ], o termo log Z(x) cancela-se de forma exata.'
        },
        {
          id: 'opt-b',
          text: 'O termo Z(x) é removido definindo a taxa de aprendizado para 0.0001.',
          isCorrect: false,
          explanation: 'Incorreto. O cancelamento é uma propriedade algébrica exata do quociente de recompensas, não um efeito de taxa de aprendizado.'
        },
        {
          id: 'opt-c',
          text: 'O DPO aproxima Z(x) assumindo que Z(x) = 1.0 para todas as entradas.',
          isCorrect: false,
          explanation: 'Incorreto. O cancelamento é analítico e exato; não se trata de aproximação Z(x)=1.'
        },
        {
          id: 'opt-d',
          text: 'Z(x) é cancelado adicionando uma camada de Softmax extra no final do modelo.',
          isCorrect: false,
          explanation: 'Incorreto. O cancelamento ocorre na função de perda logística do DPO.'
        }
      ],
      expectedInvariant: 'Exact Partition Function Cancellation Invariant in DPO',
      detailedInvariantSolution: 'Gabarito oficial: O quociente de probabilidades pi_theta / pi_ref cancela estritamente a partição de normalização Z(x) por ser invariante a x no denominador global da família Gibbs/Boltzmann.'
    },
    {
      id: 'm3-q7',
      number: 7,
      title: '7. ORPO Odds-Ratio Mechanics & Single Objective Alignment',
      scenario: 'O algoritmo ORPO (Odds Ratio Preference Optimization) substitui o pipeline de duas etapas (SFT seguido de DPO/PPO) por um único objetivo unificado de otimização.',
      problemStatement: 'Por que o odds-ratio penalty em ORPO atua simultaneamente como otimizador de verossimilhança e discriminador implícito de preferência sem modelo de referência?',
      options: [
        {
          id: 'opt-a',
          text: 'ORPO penaliza o log-odds da resposta rejeitada penalizando diretamente o gradiente de probabilidade da classe indesejada versus a escolhida em um único objetivo unificado L_ORPO = L_SFT + lambda * L_OR.',
          isCorrect: true,
          explanation: 'Correto. A probabilidade da resposta escolhida é maximizada pelo termo L_SFT enquanto a razão de chances Odds(y_w)/Odds(y_l) empurra ativamente a distribuição de probabilidade para longe das respostas rejeitadas, dispensando a comparação com pi_ref.'
        },
        {
          id: 'opt-b',
          text: 'ORPO utiliza uma rede neural discriminadora separada treinada com perda GAN adversarial.',
          isCorrect: false,
          explanation: 'Incorreto. ORPO não possui rede discriminadora separada nem usa treinamento adversarial GAN.'
        },
        {
          id: 'opt-c',
          text: 'O odds-ratio altera as tabelas de atenção trocando Softmax por Sigmoid em todas as camadas.',
          isCorrect: false,
          explanation: 'Incorreto. ORPO opera apenas na função de perda final sobre os logits de saída.'
        },
        {
          id: 'opt-d',
          text: 'ORPO exige a execução do algoritmo MCTS na fase de geração de tokens.',
          isCorrect: false,
          explanation: 'Incorreto. Trata-se de um objetivo de perda para treinamento supervisionado.'
        }
      ],
      expectedInvariant: 'Single-Objective Odds-Ratio Preference Invariant (ORPO)',
      detailedInvariantSolution: 'Gabarito oficial: ORPO penaliza o log-odds da resposta rejeitada penalizando diretamente o gradiente de probabilidade da classe indesejada versus a escolhida em um único objetivo unificado.'
    },
    {
      id: 'm3-q8',
      number: 8,
      title: '8. Catastrophic Forgetting Guardrail & Statistical CI/CD Promotion Gate',
      scenario: 'Antes de implantar um adaptador LoRA em produção, a esteira de CI/CD submete o modelo adaptado a uma bateria de testes contra o modelo base em um benchmark de sanidade fora de domínio.',
      problemStatement: 'Formalize o teste estatístico exigido pelo invariante zero-regression para aprovar o artefato LoRA no portão de promoção CI/CD.',
      options: [
        {
          id: 'opt-a',
          text: 'p-value(t_paired(scores_post, scores_pre)) >= 0.05 e Delta_mean >= -epsilon_delta para demonstrar a ausência de degradação estatisticamente significante na capacidade geral.',
          isCorrect: true,
          explanation: 'Correto. O teste t pareado (ou teste de Wilcoxon) valida a hipótese nula H0 (não há degradação nas pontuações entre pré e pós-treino). Um p-valor >= 0.05 com margem de diferença media contida em epsilon_delta (<=0.02) garante a aprovação automatizada no CI/CD.'
        },
        {
          id: 'opt-b',
          text: 'p-value < 0.001 no teste qui-quadrado garantindo que todas as respostas mudaram.',
          isCorrect: false,
          explanation: 'Incorreto. Queremos provar que a capacidade geral NÃO sofreu regressão (p-valor alto para H0).'
        },
        {
          id: 'opt-c',
          text: 'Acurácia idêntica a 100.0% em exatamente 3 exemplos do dataset de treino.',
          isCorrect: false,
          explanation: 'Incorreto. Acurácia no dataset de treino não avalia regressão em benchmarks genéricos fora de domínio.'
        },
        {
          id: 'opt-d',
          text: 'Cálculo da norma L2 do código fonte do repositório Git.',
          isCorrect: false,
          explanation: 'Incorreto. Sem qualquer sentido para métricas de desempenho de modelos de IA.'
        }
      ],
      expectedInvariant: 'Statistical Non-Degradation Invariant: Paired t-test p-value >= 0.05',
      detailedInvariantSolution: 'Gabarito oficial: p-value(t_paired(scores_post, scores_pre)) >= 0.05 e Delta_mean >= -epsilon_delta para gates de promoção de artefato.'
    },
    {
      id: 'm3-q9',
      number: 9,
      title: '9. Memory Bandwidth Bound vs Compute Bound em Inferência Quantizada',
      scenario: 'A quantização AWQ/GPTQ de 4 bits reduz o consumo de VRAM de um modelo 70B de 140GB para 35GB. Durante a geração autoregressiva token-a-token, observa-se aumento no throughput de tokens/segundo.',
      problemStatement: 'Qual é o impacto do perfil memory bandwidth bound vs compute bound na latência de inferência de decodificação autoregressiva com KV Cache e GEMM de pesos?',
      options: [
        {
          id: 'opt-a',
          text: 'Inferência autoregressiva decodificadora é estritamente memory bandwidth bound; o menor footprint de peso quantizado reduz a quantidade de bytes transferidos da VRAM para a SRAM da GPU a cada token gerado, aumentando drasticamente o throughput efetivo.',
          isCorrect: true,
          explanation: 'Correto. Na fase de decodificação (batch size reduzido), a GPU gasta a maior parte do tempo transferindo os pesos de cada camada da VRAM para os registradores. Reduzir os pesos de 16-bit para 4-bit corta a transferência de memória em 4x, liberando a gargalo de largura de banda.'
        },
        {
          id: 'opt-b',
          text: 'Decodificação autoregressiva é compute bound; a quantização aumenta o número de FLOPS e desacelera o modelo.',
          isCorrect: false,
          explanation: 'Incorreto. A decodificação token-a-token é dominada por tráfego de memória (memory bandwidth bound), não por limites de FLOPS.'
        },
        {
          id: 'opt-c',
          text: 'A quantização elimina totalmente a necessidade de carregar o KV Cache.',
          isCorrect: false,
          explanation: 'Incorreto. O KV Cache continua sendo mantido na VRAM para evitar o reprocessamento de tokens anteriores.'
        },
        {
          id: 'opt-d',
          text: 'O ganho de velocidade ocorre unicamente porque o modelo passa a ignorar as camadas de atenuação.',
          isCorrect: false,
          explanation: 'Incorreto. Todas as camadas são executadas; o ganho advém da aceleração do tráfego de memória VRAM.'
        }
      ],
      expectedInvariant: 'Memory Bandwidth Bottleneck Invariant in Decoders',
      detailedInvariantSolution: 'Gabarito oficial: Inferência autoregressiva decodificadora é estritamente memory bandwidth bound; menor footprint reduz pressão de largura de banda de VRAM por token gerado, melhorando throughput efetivo.'
    },
    {
      id: 'm3-q10',
      number: 10,
      title: '10. Zero-Mock Fine-Tuning Artifact Contract & Reproducibilidade',
      scenario: 'Para garantir governança e auditoria de modelos adaptados em produção, o ecossistema exige um contrato de validação rigoroso para cada artefato exportado.',
      problemStatement: 'Qual estrutura de contrato Pydantic/YAML valida a integridade e reprodutibilidade do adaptador de saída do fine-tuning?',
      options: [
        {
          id: 'opt-a',
          text: 'Esquema Pydantic validando base_model_sha256, adapter_hash, lora_alpha, rank, e ||Delta W||_F <= tau_max para impedir desvios catastróficos e garantir rastreabilidade auditável do adaptador.',
          isCorrect: true,
          explanation: 'Correto. O contrato de artefato exige a ancoragem do hash criptográfico do modelo base, parâmetros de configuração de baixo posto (alpha, rank), hash do adaptador e a validação da norma Frobenius do desvio ||Delta W||_F contido no limite tau_max.'
        },
        {
          id: 'opt-b',
          text: 'Um arquivo TXT simples contendo a palavra "SUCCESS".',
          isCorrect: false,
          explanation: 'Incorreto. Um arquivo de texto genérico viola todos os requisitos de governança e rastreabilidade.'
        },
        {
          id: 'opt-c',
          text: 'Um script Python em branco executado no startup do servidor.',
          isCorrect: false,
          explanation: 'Incorreto. Não valida hashs nem limites matemáticos de desvio de pesos.'
        },
        {
          id: 'opt-d',
          text: 'Enviar um e-mail de notificação para a equipe de infraestrutura.',
          isCorrect: false,
          explanation: 'Incorreto. Notificações não são contratos automatizados de validação de software/IA.'
        }
      ],
      expectedInvariant: 'Artifact Traceability & Norm Bound Invariant',
      detailedInvariantSolution: 'Gabarito oficial: Esquema Pydantic validando base_model_sha256, adapter_hash, lora_alpha, rank, e ||Delta W||_F <= tau_max.'
    }
  ]
};

export class LoRACalculator {
  public static calculateParams(config: { d: number; k: number; r: number; alpha: number }) {
    const { d, k, r, alpha } = config;

    const originalParams = d * k;
    const loraParams = r * (d + k);
    const reductionFactor = originalParams / Math.max(loraParams, 1);
    const scaleRatio = alpha / Math.max(r, 1);

    return {
      originalParams,
      loraParams,
      reductionFactor,
      scaleRatio
    };
  }

  public static validateArtifactContract(contract: {
    baseModelSha256: string;
    adapterHash: string;
    loraAlpha: number;
    rank: number;
    deltaNormFrobenius: number;
    tauMax: number;
  }): { valid: boolean; reason?: string } {
    if (contract.deltaNormFrobenius > contract.tauMax) {
      return {
        valid: false,
        reason: `Norma Frobenius Delta W (${contract.deltaNormFrobenius.toFixed(4)}) excede tauMax (${contract.tauMax}). Risk of drift.`
      };
    }
    if (!contract.baseModelSha256 || contract.baseModelSha256.length < 16) {
      return { valid: false, reason: 'Hash do modelo base ausente ou inválido.' };
    }
    return { valid: true };
  }
}

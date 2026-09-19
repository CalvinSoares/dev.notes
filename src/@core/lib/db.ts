import Dexie, { type Table } from "dexie";
import type { Flashcard, LeetCodeProblem, Article, Snippet, StudyPhase, StudyDiagram, QuizAttempt, QuizQuestion, QuizExam } from "@core/types";
import type { StudyRoadmap, StudyRoadmapNode, StudyRoadmapLink } from "@core/types/roadmap";
import { subDays, addDays } from "date-fns";

export interface RetroDBSchema {
  flashcards: Flashcard;
  leetcode_problems: LeetCodeProblem;
  articles: Article;
  snippets: Snippet;
  diagrams: StudyDiagram;
  quiz_exams: QuizExam;
  quiz_questions: QuizQuestion;
  quiz_attempts: QuizAttempt;
  study_roadmaps: StudyRoadmap;
  roadmap_nodes: StudyRoadmapNode;
  roadmap_links: StudyRoadmapLink;
}

const iso = (d: Date) => d.toISOString();
const now = new Date();

const SAMPLE_DDIA_MD = `# Designing Data-Intensive Applications
## Cap 1 — Foundations of Data Systems

### Three Concerns (fundamentais para TODO sistema)
1. **Reliability** — tolera falhas humanas / hw / sw.
2. **Scalability** — mantém performance sob carga (load + performance + latency percentiles).
3. **Maintainability** — legibilidade, capacidade de evoluir, ops simples.

### Data Models
- Relacional (SQL) → ACID, joins maduros, schema-on-write.
- Document → flexibilidade de schema (schema-on-read), data locality.
- Graph → relações muitos-para-muitos, Cypher/Gremlin/SPARQL.

#### Tabela comparativa
| Modelo     | Schema       | Joins | Transações |
|------------|--------------|-------|------------|
| Relacional | on-write     | bom   | ACID forte |
| Document   | on-read      | ruim  | por doc    |
| Graph      | on-write     | ótimo | variável   |

- [x] Ler capítulo 1
- [x] Anotar 3 pilares
- [ ] Repetir no flashcard deck

> "The limits of my language mean the limits of my world." — Wittgenstein (adaptado: os limites do seu **data model** definem os limites da sua aplicação)

\`\`\`sql
-- Exemplo: Postgres com JSONB = híbrido
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'
);
SELECT * FROM articles WHERE metadata->>'tags' ? 'systems';
\`\`\`

#### Pergunta de entrevista típica:
> "Quando escolher MongoDB vs Postgres?"

R: **Postgres** se você PRECISA de joins + transações ACID fortes. **Document DB** se o acesso é sempre por documento e o esquema é fluido. Hoje: Postgres tem **JSONB** → pior dos dois mundos? =) Melhor: escolha Postgres como default e use JSONB onde o schema for realmente fluido.
`;

const SAMPLE_REACT_MD = `# React Advanced Architectural Patterns & Mental Models

## 1. useState vs useReducer: Quando usar qual?
- **useState**: Ideal para estados primitivos ou independentes (ex: booleanos de loading, inputs simples).
- **useReducer**: Ideal para estados complexos onde múltiplos sub-valores dependem uns dos outros ou quando a próxima transição de estado depende estritamente da anterior. Reducers tornam a lógica de mutação previsível, centralizada em puras funções testáveis fora do componente.

## 2. useEffect vs useLayoutEffect
- **useEffect**: Disparado **após** o paint do browser de forma assíncrona. Não bloqueia a renderização visual. Use para data fetching, subscriptions e logging.
- **useLayoutEffect**: Disparado **sincronamente** logo após o DOM ser mutado, mas **antes** do browser pintar (paint). Use quando precisar medir elementos DOM (ex: \`getBoundingClientRect\`) ou prevenir "flickers" visuais em animações baseadas em estado síncrono.

## 3. Otimizações: memo, useMemo e useCallback
- **React.memo**: Evita re-renderizações de componentes filhos caso as props passadas sejam referencialmente iguais.
- **useMemo**: Guarda o **resultado computado** de uma função custosa entre renders.
- **useCallback**: Guarda a **referência da função** entre renders. Essencial ao passar funções como dependências para efeitos ou componentes otimizados com \`memo\`.

\`\`\`tsx
// Exemplo de useReducer tipado
type State = { count: number; error: string | null };
type Action = { type: 'increment' } | { type: 'set_error'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1, error: null };
    case 'set_error':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}
\`\`\`
`;

const SAMPLE_VUE_MD = `# Vue 3 Composition API & Reactivity Mental Model

## 1. Ref vs Reactive
- **ref()**: Funciona com primitivos e objetos. Cria um objeto reativo encapsulado acessado via \`.value\` no script. No template, o Vue faz o unwrapping automático.
- **reactive()**: Funciona apenas com objetos/arrays. Retorna um Proxy direto (sem \`.value\`). Cuidado ao desestruturar (\`toRefs\`), pois perde a reatividade se feito incorretamente.

## 2. Computed vs Watch vs WatchEffect
- **computed()**: Lazy, cacheado com base em suas dependências reativas. Só reavalia quando dependências mudam.
- **watch()**: Explícito. Monitora fontes específicas de dados (refs, getters) e executa efeitos colaterais quando mudam. Permite acesso ao valor antigo e novo (\`oldVal, newVal\`).
- **watchEffect()**: Roda imediatamente rastreando automaticamente qualquer dependência reativa usada dentro de seu callback (semelhante ao \`useEffect\` sem array de dependências, mas otimizado para rastreamento de dependências automáticas).

## 3. Provide / Inject (Dependency Injection)
Evita "prop drilling" profundo. Passa dados reativos de um componente ancestral para qualquer descendente na árvore de componentes sem precisar retransmitir manualmente de nível em nível.
`;

export const SEED_FLASHCARDS: Flashcard[] = [
  // --- JS / FUNDAMENTALS ---
  {
    id: "fc-1",
    question: "Qual a diferença entre call(), apply() e bind() em JavaScript?",
    answer:
      'Todos mudam o "this" de uma função. call(thisArg, a, b) e apply(thisArg, [a,b]) executam imediatamente (variadic vs array). bind(thisArg) retorna uma nova função com o this ligado, para execução posterior.',
    language: "javascript",
    tags: ["JS", "Fundamentals"],
    interval: 1,
    easeFactor: 2.5,
    repetitions: 3,
    lastReviewAt: iso(subDays(now, 2)),
    nextReviewAt: iso(subDays(now, 1)),
    createdAt: iso(subDays(now, 40)),
    updatedAt: iso(subDays(now, 2)),
  },
  {
    id: "fc-2",
    question: "Explique o conceito de Closure em JS.",
    answer:
      'Uma closure é uma função que "lembra" do escopo léxico onde foi definida, mesmo quando executada fora dele. Permite dados privados, currying, e factories.',
    language: "javascript",
    tags: ["JS", "Fundamentals"],
    interval: 3,
    easeFactor: 2.6,
    repetitions: 5,
    lastReviewAt: iso(subDays(now, 3)),
    nextReviewAt: iso(now),
    createdAt: iso(subDays(now, 35)),
    updatedAt: iso(subDays(now, 3)),
  },
  {
    id: "fc-3",
    question: "Como funciona o Event Loop no Node.js?",
    answer:
      "Fases (6): timers → pending callbacks → idle/prepare → poll → check → close callbacks. Cada fase tem uma fila; o loop esgota a fila (ou limite) antes de avançar. Microtasks (Promise.nextTick) rodam entre fases.",
    tags: ["Node.js", "Runtime"],
    interval: 1,
    easeFactor: 2.3,
    repetitions: 2,
    lastReviewAt: iso(subDays(now, 1)),
    nextReviewAt: iso(subDays(now, 0)),
    createdAt: iso(subDays(now, 20)),
    updatedAt: iso(subDays(now, 1)),
  },
  // --- REACT ---
  {
    id: "fc-react-1",
    question: "Quando você deve escolher useReducer em vez de useState?",
    answer:
      "Quando o estado envolve lógica complexa que atacha múltiplos sub-valores ou quando a atualização do próximo estado depende estritamente do estado anterior de maneira estruturada (ex: máquina de estados). Reducers também facilitam testes unitários puros da lógica de transição.",
    language: "tsx",
    tags: ["React", "Hooks"],
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewAt: iso(now),
    createdAt: iso(subDays(now, 5)),
    updatedAt: iso(subDays(now, 5)),
  },
  {
    id: "fc-react-2",
    question: "Qual a diferença prática entre useEffect e useLayoutEffect?",
    answer:
      "useEffect roda de forma assíncrona DEPOIS que o browser pintou a tela (evita travamentos visuais). useLayoutEffect roda de forma SÍNCRONA logo após as mutações do DOM, mas ANTES do paint. Use layoutEffect apenas se precisar medir layouts (getBoundingClientRect) para evitar flash visual.",
    language: "tsx",
    tags: ["React", "Hooks", "DOM"],
    interval: 1,
    easeFactor: 2.5,
    repetitions: 1,
    nextReviewAt: iso(addDays(now, 1)),
    createdAt: iso(subDays(now, 5)),
    updatedAt: iso(subDays(now, 5)),
  },
  {
    id: "fc-react-3",
    question: "Para que serve o useCallback e quando ele é realmente útil?",
    answer:
      "useCallback memoriza a instância de uma função entre renders. Ele SÓ é útil quando passado como prop para componentes filhos otimizados com React.memo ou quando a função é dependência de outro useEffect/useMemo, evitando re-execuções desnecessárias.",
    language: "tsx",
    tags: ["React", "Performance"],
    interval: 2,
    easeFactor: 2.6,
    repetitions: 2,
    nextReviewAt: iso(now),
    createdAt: iso(subDays(now, 10)),
    updatedAt: iso(subDays(now, 2)),
  },
  {
    id: "fc-react-4",
    question:
      "Como o Context API (useContext + createContext) afeta a performance?",
    answer:
      "Qualquer componente que consome o contexto será re-renderizado sempre que o valor do Provider mudar, independentemente de usar ou não propriedades específicas daquele objeto de contexto (a menos que fatiado em múltiplos contextos ou otimizado com seletores/memoização).",
    language: "tsx",
    tags: ["React", "Architecture"],
    interval: 1,
    easeFactor: 2.4,
    repetitions: 1,
    nextReviewAt: iso(now),
    createdAt: iso(subDays(now, 8)),
    updatedAt: iso(subDays(now, 3)),
  },
  // --- VUE ---
  {
    id: "fc-vue-1",
    question: "Qual a diferença entre ref() e reactive() no Vue 3?",
    answer:
      "ref() aceita qualquer tipo (primitivos ou objetos) e expõe o valor encapsulado via .value (com unwrapping automático no template). reactive() aceita apenas objetos/arrays baseados em Proxy (sem .value), mas cuidado com a desestruturação direta, que quebra a reatividade (exige toRefs).",
    language: "typescript",
    tags: ["Vue", "Reactivity"],
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewAt: iso(now),
    createdAt: iso(subDays(now, 4)),
    updatedAt: iso(subDays(now, 4)),
  },
  {
    id: "fc-vue-2",
    question: "Qual a diferença entre watch() e watchEffect() no Vue 3?",
    answer:
      "watch() é preguiçoso (lazy) e monitora fontes de dados explícitas específicas, dando acesso ao valor anterior e atual. watchEffect() executa imediatamente rastreando automaticamente qualquer propriedade reativa acessada de forma síncrona dentro de sua função.",
    language: "typescript",
    tags: ["Vue", "Reactivity"],
    interval: 1,
    easeFactor: 2.5,
    repetitions: 1,
    nextReviewAt: iso(addDays(now, 2)),
    createdAt: iso(subDays(now, 4)),
    updatedAt: iso(subDays(now, 4)),
  },
  {
    id: "fc-vue-3",
    question: "Como funciona provide e inject no Vue 3?",
    answer:
      "Permite que um componente ancestral atue como provedor de dados para toda a árvore de descendentes diretos ou indiretos (evitando prop drilling). Para manter a reatividade de dados primitivos entre provider e injector, recomenda-se passar refs ou reactive objects.",
    language: "typescript",
    tags: ["Vue", "Architecture"],
    interval: 2,
    easeFactor: 2.7,
    repetitions: 3,
    nextReviewAt: iso(subDays(now, 1)),
    createdAt: iso(subDays(now, 15)),
    updatedAt: iso(subDays(now, 5)),
  },
];

export const SEED_LEETCODE: LeetCodeProblem[] = [
  {
    id: "lc-1",
    problemId: "lc-1",
    title: "Two Sum",
    variantName: "Hash map",
    strategy: "Guardar os complementos já vistos em um mapa.",
    url: "https://leetcode.com/problems/two-sum/",
    difficulty: "easy",
    tags: ["Array", "Hash Table"],
    complexity: "O(n) time / O(n) space",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    tradeoffs: "Mais memória em troca de uma passagem linear.",
    interval: 10,
    easeFactor: 2.6,
    repetitions: 4,
    solvedAt: iso(subDays(now, 10)),
    solution: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff)!, i];
    map.set(nums[i], i);
  }
  return [];
}`,
    nextReviewAt: iso(subDays(now, 1)),
    createdAt: iso(subDays(now, 30)),
    updatedAt: iso(subDays(now, 7)),
  },
  {
    id: "lc-1-bruteforce",
    problemId: "lc-1",
    title: "Two Sum",
    variantName: "Força bruta",
    strategy: "Testar todos os pares possíveis até encontrar o alvo.",
    url: "https://leetcode.com/problems/two-sum/",
    difficulty: "easy",
    tags: ["Array", "Brute Force"],
    complexity: "O(n²) time / O(1) space",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    tradeoffs: "Excelente baseline para entender o problema, mas escala mal.",
    solution: `function twoSum(nums: number[], target: number): number[] {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}`,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewAt: iso(now),
    createdAt: iso(subDays(now, 30)),
    updatedAt: iso(subDays(now, 30)),
  },
  {
    id: "lc-2",
    title: "Valid Parentheses",
    url: "https://leetcode.com/problems/valid-parentheses/",
    difficulty: "easy",
    tags: ["Stack", "String"],
    complexity: "O(n) time / O(n) space",
    interval: 15,
    easeFactor: 2.5,
    repetitions: 3,
    solvedAt: iso(subDays(now, 15)),
    nextReviewAt: iso(subDays(now, 2)),
    createdAt: iso(subDays(now, 25)),
    updatedAt: iso(subDays(now, 5)),
  },
  {
    id: "lc-3",
    title: "Longest Substring Without Repeating",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    difficulty: "medium",
    tags: ["Sliding Window", "Hash Table"],
    complexity: "O(n) time / O(min(m,n))",
    interval: 3,
    easeFactor: 2.4,
    repetitions: 2,
    solvedAt: iso(subDays(now, 6)),
    nextReviewAt: iso(now),
    createdAt: iso(subDays(now, 20)),
    updatedAt: iso(subDays(now, 3)),
  },
];

export const SEED_ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "Designing Data-Intensive Applications — Part. 1",
    url: "https://dataintensive.net/",
    summary:
      "Três pilares de qualquer sistema: Reliability, Scalability, Maintainability. Data models: Relacional vs Document vs Graph. Storage: B-trees vs LSM-trees.",
    content: SAMPLE_DDIA_MD,
    tags: ["Systems", "Books"],
    interval: 21,
    easeFactor: 2.6,
    repetitions: 4,
    nextReviewAt: iso(subDays(now, 5)),
    createdAt: iso(subDays(now, 60)),
    updatedAt: iso(subDays(now, 10)),
  },
  {
    id: "art-2",
    title: "React Advanced Hooks & Performance Patterns",
    url: "https://react.dev/",
    summary:
      "Análise profunda sobre useState vs useReducer, ciclo de render com useEffect e useLayoutEffect, e estratégias avançadas de otimização com memo, useMemo e useCallback.",
    content: SAMPLE_REACT_MD,
    tags: ["React", "Frontend", "Hooks"],
    interval: 3,
    easeFactor: 2.5,
    repetitions: 2,
    nextReviewAt: iso(now),
    createdAt: iso(subDays(now, 20)),
    updatedAt: iso(subDays(now, 7)),
  },
  {
    id: "art-3",
    title: "Vue 3 Composition API & Reactivity Mechanics",
    url: "https://vuejs.org/",
    summary:
      "Como o sistema baseado em Proxies do Vue 3 opera comparando ref vs reactive, computed properties inteligentes e watch vs watchEffect.",
    content: SAMPLE_VUE_MD,
    tags: ["Vue", "Frontend", "Reactivity"],
    interval: 5,
    easeFactor: 2.7,
    repetitions: 3,
    nextReviewAt: iso(addDays(now, 2)),
    createdAt: iso(subDays(now, 15)),
    updatedAt: iso(subDays(now, 3)),
  },
];

export const SEED_SNIPPETS: Snippet[] = [
  {
    id: "sn-1",
    title: "Debounce (TS)",
    language: "typescript",
    code: `export function debounce<T extends (...args: any[]) => any>(fn: T, ms = 300) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}`,
    tags: ["JS", "Utils"],
    createdAt: iso(subDays(now, 10)),
    updatedAt: iso(subDays(now, 10)),
  },
  {
    id: "sn-2",
    title: "React useLocalStorage Hook (TS)",
    language: "typescript",
    code: `import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}`,
    tags: ["React", "Hooks", "Utils"],
    createdAt: iso(subDays(now, 5)),
    updatedAt: iso(subDays(now, 5)),
  },
];

class RetroCodeDexie extends Dexie {
  flashcards!: Table<Flashcard, string>;
  leetcode_problems!: Table<LeetCodeProblem, string>;
  articles!: Table<Article, string>;
  snippets!: Table<Snippet, string>;
  study_phases!: Table<StudyPhase, string>;
  diagrams!: Table<StudyDiagram, string>;
  quiz_exams!: Table<QuizExam, string>;
  quiz_questions!: Table<QuizQuestion, string>;
  quiz_attempts!: Table<QuizAttempt, string>;
  study_roadmaps!: Table<StudyRoadmap, string>;
  roadmap_nodes!: Table<StudyRoadmapNode, string>;
  roadmap_links!: Table<StudyRoadmapLink, string>;

  constructor() {
    super("retrocode-study-db");
    this.version(1).stores({
      flashcards: "id, nextReviewAt, repetitions, interval",
      leetcode_problems: "id, difficulty, nextReviewAt",
      articles: "id, nextReviewAt",
      snippets: "id, language, createdAt",
    });
    this.version(2).stores({
      flashcards: "id, nextReviewAt, repetitions, interval",
      leetcode_problems: "id, difficulty, nextReviewAt",
      articles: "id, nextReviewAt",
      snippets: "id, language, createdAt",
      study_phases: "id, updatedAt",
    });
    this.version(3).stores({
      flashcards: "id, nextReviewAt, repetitions, interval",
      leetcode_problems: "id, problemId, difficulty, nextReviewAt",
      articles: "id, nextReviewAt",
      snippets: "id, language, createdAt",
      study_phases: "id, updatedAt",
    });
    this.version(4).stores({
      flashcards: "id, nextReviewAt, repetitions, interval",
      leetcode_problems: "id, problemId, difficulty, nextReviewAt",
      articles: "id, nextReviewAt",
      snippets: "id, language, createdAt",
      study_phases: "id, updatedAt",
      diagrams: "id, updatedAt",
    });    this.version(5).stores({
      flashcards: "id, nextReviewAt, repetitions, interval",
      leetcode_problems: "id, problemId, difficulty, nextReviewAt",
      articles: "id, nextReviewAt",
      snippets: "id, language, createdAt",
      study_phases: "id, updatedAt",
      diagrams: "id, updatedAt",
      quiz_questions: "id, examName, subject, topic, updatedAt",
      quiz_attempts: "id, startedAt, finishedAt",
    });
    this.version(6).stores({
      flashcards: "id, nextReviewAt, repetitions, interval",
      leetcode_problems: "id, problemId, difficulty, nextReviewAt",
      articles: "id, nextReviewAt",
      snippets: "id, language, createdAt",
      study_phases: "id, updatedAt",
      diagrams: "id, updatedAt",
      quiz_exams: "id, contestName, vacancy, updatedAt",
      quiz_questions: "id, examId, examName, subject, topic, updatedAt",
      quiz_attempts: "id, startedAt, finishedAt",
    });
    this.version(7).stores({
      flashcards: "id, nextReviewAt, repetitions, interval",
      leetcode_problems: "id, problemId, difficulty, nextReviewAt",
      articles: "id, nextReviewAt",
      snippets: "id, language, createdAt",
      study_phases: "id, updatedAt",
      diagrams: "id, updatedAt",
      quiz_exams: "id, contestName, vacancy, updatedAt",
      quiz_questions: "id, examId, examName, subject, topic, updatedAt",
      quiz_attempts: "id, startedAt, finishedAt",
      study_roadmaps: "id, status, updatedAt",
      roadmap_nodes: "id, roadmapId, parentId, updatedAt",
      roadmap_links: "id, nodeId, resourceType, resourceId",
    });
  }
}

export const db = new RetroCodeDexie();

let synced = false;
export async function seedIfEmpty(): Promise<void> {
  if (synced) return;

  // Usamos bulkPut para atualizar ou inserir os itens padrão sem apagar revisões/mudanças do usuário
  await Promise.all([
    db.flashcards.bulkPut(SEED_FLASHCARDS),
    db.leetcode_problems.bulkPut(SEED_LEETCODE),
    db.articles.bulkPut(SEED_ARTICLES),
    db.snippets.bulkPut(SEED_SNIPPETS),
  ]);

  synced = true;
}
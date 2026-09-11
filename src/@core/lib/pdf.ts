import type { QuestionOptionId, QuizQuestionOption } from "@core/types";

let pdfModule: Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")> | undefined;

async function loadPdfModule() {
  pdfModule ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((module) => {
    module.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();
    return module;
  });
  return pdfModule;
}
export interface ParsedPdfQuestion {
  number: number;
  statement: string;
  options: QuizQuestionOption[];
  correctOption?: QuestionOptionId;
  pageNumber?: number;
  visualFallback?: boolean;
  visualReference?: boolean;
  visualPageNumbers?: number[];
  visualImage?: string;
  visualImages?: string[];
}

type PdfTextItem = { str?: string; transform?: number[]; width?: number };
type TextPiece = { text: string; x: number; width: number };

function normalizePdfGlyphs(value: string) {
  const glyphs: Record<string, string> = {
    "\uF028": "(",
    "\uF029": ")",
    "\uF0AE": "→",
    "\uF0D8": "¬",
    "\uF0D9": "∧",
    "\uF0DA": "∨",
  };
  return value.replace(/[\uF028\uF029\uF0AE\uF0D8-\uF0DA]/g, (glyph) => glyphs[glyph] ?? glyph);
}

function formatPdfLine(pieces: TextPiece[], originX: number) {
  const ordered = [...pieces].sort((first, second) => first.x - second.x);
  let result = "";
  let previousEnd = originX;

  for (const piece of ordered) {
    const text = normalizePdfGlyphs(piece.text).trim();
    if (!text) continue;
    const gap = piece.x - previousEnd;
    if (result) {
      if (gap >= 2) result += " ".repeat(Math.max(1, Math.min(16, Math.round(gap / 6))));
    } else if (gap > 6) {
      // Conserva a indentação de código, SQL e tabelas em relação à margem da coluna.
      result += " ".repeat(Math.min(16, Math.round(gap / 4)));
    }
    result += text;
    previousEnd = Math.max(previousEnd, piece.x + piece.width);
  }
  return result.trimEnd();
}

export async function readPdfText(file: File): Promise<string> {
  const { getDocument } = await loadPdfModule();
  const document = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];

  for (let index = 1; index <= document.numPages; index += 1) {
    const page = await document.getPage(index);
    const content = await page.getTextContent();
    const middle = page.getViewport({ scale: 1 }).width / 2;
    const left = new Map<number, TextPiece[]>();
    const right = new Map<number, TextPiece[]>();
    let leftOrigin = Number.POSITIVE_INFINITY;
    let rightOrigin = Number.POSITIVE_INFINITY;
    let rightItemCount = 0;

    for (const item of content.items as PdfTextItem[]) {
      if (!item.str?.trim()) continue;
      const rawY = Math.round(item.transform?.[5] ?? 0);
      const x = item.transform?.[4] ?? 0;
      const piece: TextPiece = { text: item.str, x, width: item.width ?? item.str.length * 5 };
      const column = x >= middle ? right : left;
      // Alguns símbolos matemáticos ficam 1 px acima/abaixo da linha-base do texto.
      const y = Array.from(column.keys()).find((lineY) => Math.abs(lineY - rawY) <= 2) ?? rawY;
      column.set(y, [...(column.get(y) ?? []), piece]);
      if (column === right) {
        rightItemCount += 1;
        rightOrigin = Math.min(rightOrigin, x);
      } else {
        leftOrigin = Math.min(leftOrigin, x);
      }
    }

    const formatColumn = (lines: Map<number, TextPiece[]>, originX: number) => Array.from(lines.entries())
      .sort(([firstY], [secondY]) => secondY - firstY)
      .map(([, values]) => formatPdfLine(values, originX))
      .filter(Boolean)
      .join("\n");

    // Provas em duas colunas não podem ser ordenadas apenas por altura: isso mistura
    // o enunciado da esquerda com as alternativas da direita. Em uma coluna só,
    // junte os fragmentos à direita (por exemplo, hifens no fim de uma linha longa).
    const leftText = formatColumn(left, Number.isFinite(leftOrigin) ? leftOrigin : 0);
    const rightText = formatColumn(right, Number.isFinite(rightOrigin) ? rightOrigin : 0);
    if (rightItemCount >= 10) {
      pages.push(`${leftText}\n${rightText}`);
    } else {
      const singleColumn = new Map<number, TextPiece[]>();
      for (const [y, pieces] of left) singleColumn.set(y, [...pieces]);
      for (const [y, pieces] of right) singleColumn.set(y, [...(singleColumn.get(y) ?? []), ...pieces]);
      const originX = Math.min(leftOrigin, rightOrigin);
      pages.push(formatColumn(singleColumn, Number.isFinite(originX) ? originX : 0));
    }
  }
  return pages.map((page, index) => `[[DEV_NOTES_PAGE:${index + 1}]]\n${page}`).join("\n\n");
}

export interface AnswerKeyVariant {
  version: number;
  label: string;
  answers: Map<number, QuestionOptionId>;
}

function extractAnswerEntries(items: PdfTextItem[]) {
  const positioned = items
    .filter((item) => item.str?.trim())
    .map((item) => ({ text: item.str!.trim(), x: item.transform?.[4] ?? 0, y: item.transform?.[5] ?? 0 }));
  const letters = positioned.filter((item) => /^[A-E]$/i.test(item.text));

  return positioned.flatMap((item) => {
    const match = item.text.match(/^(\d{1,3})\s*-\s*$/);
    if (!match) return [];
    const answer = letters
      .filter((letter) => letter.x > item.x && letter.x - item.x < 45 && Math.abs(letter.y - item.y) <= 3)
      .sort((first, second) => first.x - second.x)[0];
    return answer ? [{ number: Number(match[1]), answer: answer.text.toUpperCase() as QuestionOptionId, x: item.x, y: item.y }] : [];
  });
}

export async function readAnswerKeyVariants(file: File): Promise<AnswerKeyVariant[]> {
  const { getDocument } = await loadPdfModule();
  const pdfDocument = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const commonAnswers = new Map<number, QuestionOptionId>();
  const variants = new Map<number, { label: string; answers: Map<number, QuestionOptionId> }>();

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const content = await (await pdfDocument.getPage(pageNumber)).getTextContent();
    const items = content.items as PdfTextItem[];
    const headings = items.flatMap((item) => {
      const match = item.str?.trim().match(/^PROVA\s+(\d+)$/i);
      return match ? [{ version: Number(match[1]), x: item.transform?.[4] ?? 0, y: item.transform?.[5] ?? 0 }] : [];
    });
    const entries = extractAnswerEntries(items);

    if (!headings.length) {
      for (const entry of entries) if (entry.number <= 20) commonAnswers.set(entry.number, entry.answer);
      continue;
    }

    for (const heading of headings) {
      variants.set(heading.version, variants.get(heading.version) ?? { label: `Prova ${heading.version}`, answers: new Map() });
    }
    for (const entry of entries) {
      const heading = [...headings].sort((first, second) => Math.abs(first.x - entry.x) - Math.abs(second.x - entry.x))[0];
      variants.get(heading.version)?.answers.set(entry.number, entry.answer);
    }
  }

  return Array.from(variants.entries())
    .map(([version, variant]) => ({ version, label: variant.label, answers: new Map([...commonAnswers, ...variant.answers]) }))
    .sort((first, second) => first.version - second.version);
}

export function detectProofVersion(text: string): number | undefined {
  const match = text.match(/PROVA\s+(\d+)\s*(?:-|–|—)/i);
  return match ? Number(match[1]) : undefined;
}
export async function renderPdfPage(file: File, pageNumber: number): Promise<string> {
  const { getDocument } = await loadPdfModule();
  const pdfDocument = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const page = await pdfDocument.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.4 });
  const canvas = window.document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a imagem da questão.");
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.86);
}

export function parseAnswerKey(text: string): Map<number, QuestionOptionId> {
  const answerKey = new Map<number, QuestionOptionId>();
  const matcher = /(?:^|\n|\s)(\d{1,3})\s*(?:[-–—.:]|\s)\s*([A-E])(?=\s|$)/gim;
  for (const match of text.matchAll(matcher)) answerKey.set(Number(match[1]), match[2].toUpperCase() as QuestionOptionId);
  return answerKey;
}

function formatQuestionBlock(value: string) {
  return value
    .replace(/\[\[DEV_NOTES_PAGE:\d+\]\]\s*/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function isPdfChromeLine(value: string) {
  const line = value.trim();
  return /^(?:pcimarkpci\b.*|https?:\/\/\S+|www\.\S+|TRANSPETRO|TERRA|RASCUNHO|CONHECIMENTOS ESPECÍFICOS)$/i.test(line)
    || /^PROVA\s+\d+\b.*$/i.test(line)
    || /^-\s*(?:INFRAESTRUTURA|PROCESSOS\s+DE\s+NEG[ÓO]CIOS)\b.*$/i.test(line);
}

function removePdfChrome(value: string) {
  const lines = value.replace(/\r/g, "").split("\n");
  return lines.filter((line, index) => {
    if (isPdfChromeLine(line)) return false;
    if (!/^\s*\d{1,3}\s*$/.test(line)) return true;
    // Números de página ficam próximos ao cabeçalho/rodapé; números de questão não.
    return !lines.slice(index + 1, Math.min(lines.length, index + 5)).some(isPdfChromeLine);
  }).join("\n");
}

function hasDiagramOption(options: QuizQuestionOption[]) {
  return options.some((option) => /\(\s*[01]\s*,\s*(?:0|1|n)\s*\)|\b(?:total|parcial)\s+e\s+(?:compartilhada|exclusiva)\b/i.test(option.text));
}

function hasDiagramInStatement(statement: string) {
  return /\b(?:figura|diagrama\s+E-?R)\b/i.test(statement)
    && /\(\s*[01]\s*,\s*(?:0|1|n)\s*\)/i.test(statement);
}
export function parseQuestions(text: string, answerKey = new Map<number, QuestionOptionId>()): ParsedPdfQuestion[] {
  // Une palavras quebradas pela diagramação ("modifica-\nções") sem perder os parágrafos.
  const normalized = removePdfChrome(text)
    .replace(/[“”]/g, '"')
    // Une palavras quebradas pela diagramação ("modifica-\nções") sem perder os parágrafos.
    .replace(/([\p{L}])\s*-\s*\n\s*([\p{Ll}])/gu, "$1$2" );
  const byNumber = new Map<number, ParsedPdfQuestion>();

  // Uma questão começa por um número isolado na linha, ou por "1. enunciado".
  // O uso de [ \t] evita que \s atravesse a quebra de linha e una duas questões.
  const headerMatcher = /^[ \t]*(\d{1,3})(?:[.)-][ \t]+|[ \t]*$)/gm;
  const headers = Array.from(normalized.matchAll(headerMatcher)).filter((header) => {
    const afterHeader = normalized.slice(header.index! + header[0].length, header.index! + header[0].length + 120);
    // Itens numerados dentro do enunciado (por exemplo, "3. B ∩ A ≠ ∅")
    // não são o início de uma nova questão.
    const isListItem = header[0].includes(".") && /^[ \t]*[A-Z](?:[ \t]+[A-Z]){1,2}[ \t]*(?:\n|$)/.test(afterHeader);
    // Números de página aparecem isolados antes de "PROVA", "TERRA" ou do rodapé do site.
    // Eles não devem encerrar uma questão que continuou na coluna/página seguinte.
    return !isListItem && !/^\s*(?:PROVA\b|TERRA\b|www\.|pcimarkpci\b|TRANSPETRO\b)/i.test(afterHeader);
  });

  for (let index = 0; index < headers.length; index += 1) {
    const header = headers[index];
    const number = Number(header[1]);
    const start = header.index! + header[0].length;
    const end = headers[index + 1]?.index ?? normalized.length;
    const body = normalized.slice(start, end).trim();
    const previousPages = Array.from(normalized.slice(0, header.index).matchAll(/\[\[DEV_NOTES_PAGE:(\d+)\]\]/g));
    const pageNumber = Number(previousPages.at(-1)?.[1] ?? 1);

    // Nunca confunda uma palavra iniciada por A–E com alternativa. Aceita apenas
    // marcadores reais: "(A)", "A)" ou "A.".
    const optionMatcher = /^[ \t]*(?:\(([A-E])\)|([A-E])[.)-])(?:[ \t]+|$)/gm;
    const markers = Array.from(body.matchAll(optionMatcher));
    if (number < 1 || number > 300 || !body || markers.length < 2) continue;

    const statement = formatQuestionBlock(body.slice(0, markers[0].index));
    const extractedOptions: QuizQuestionOption[] = markers.map((marker, optionIndex) => {
      const markerEnd = marker.index! + marker[0].length;
      const optionEnd = markers[optionIndex + 1]?.index ?? body.length;
      return {
        id: (marker[1] ?? marker[2]) as QuestionOptionId,
        text: formatQuestionBlock(body.slice(markerEnd, optionEnd)),
      };
    });
    // Diagramas vetoriais podem trazer apenas os rótulos (A)–(E), sem texto.
    // Nesses casos preservamos a questão e exibimos a página renderizada ao aluno.
    const visualFallback = (extractedOptions.length >= 2 && extractedOptions.filter((option) => option.text).length < 2) || hasDiagramOption(extractedOptions);
    const options = visualFallback
      ? extractedOptions.map((option) => ({ ...option, text: "Alternativa gráfica — consulte a imagem." }))
      : extractedOptions.filter((option) => option.text);

    // Cabeçalhos e números de página podem se parecer com uma questão, mas não têm
    // enunciado e alternativas completas.
    if (!statement || options.length < 2) continue;
    const candidate: ParsedPdfQuestion = {
      number,
      statement,
      options,
      correctOption: answerKey.get(number),
      pageNumber,
      visualFallback,
      visualReference: visualFallback || hasDiagramInStatement(statement),
    };
    const existing = byNumber.get(number);
    if (!existing || candidate.options.length > existing.options.length || candidate.statement.length > existing.statement.length) {
      byNumber.set(number, candidate);
    }
  }

  // Algumas questões são formadas exclusivamente por diagramas vetoriais: o PDF
  // disponibiliza só os rótulos (A)–(E). Preserve-as com a imagem da página.
  const visualOnlyMatcher = /^[ \t]*(\d{1,3})[ \t]*\n([\s\S]*?)^[ \t]*\(A\)[ \t]*$\n^[ \t]*\(B\)[ \t]*$\n^[ \t]*\(C\)[ \t]*$\n^[ \t]*\(D\)[ \t]*$\n^[ \t]*\(E\)[ \t]*$/gm;
  for (const match of normalized.matchAll(visualOnlyMatcher)) {
    const number = Number(match[1]);
    if (byNumber.has(number) || number < 1 || number > 300) continue;
    const statement = formatQuestionBlock(match[2]);
    if (!statement) continue;
    const precedingPages = Array.from(normalized.slice(0, match.index).matchAll(/\[\[DEV_NOTES_PAGE:(\d+)\]\]/g));
    const pageNumber = Number(precedingPages.at(-1)?.[1] ?? 1);
    byNumber.set(number, {
      number,
      statement,
      options: (["A", "B", "C", "D", "E"] as QuestionOptionId[]).map((id) => ({ id, text: "Alternativa gráfica — consulte a imagem." })),
      correctOption: answerKey.get(number),
      pageNumber,
      visualFallback: true,
      visualReference: true,
    });
  }
  const parsed = Array.from(byNumber.values()).sort((first, second) => first.number - second.number);
  return parsed.map((question, index) => {
    if (!question.visualReference || !question.pageNumber) return question;
    const firstPage = question.pageNumber;
    const nextPage = parsed.slice(index + 1).find((next) => next.pageNumber && next.pageNumber > firstPage)?.pageNumber;
    const lastPage = nextPage ? Math.max(firstPage, nextPage - 1) : firstPage;
    return {
      ...question,
      // Uma questão visual pode continuar na página seguinte; limite a duas páginas
      // para não salvar cópias desnecessárias do PDF no banco local.
      visualPageNumbers: Array.from({ length: Math.min(2, lastPage - firstPage + 1) }, (_, pageOffset) => firstPage + pageOffset),
    };
  });
}


























import type { Flashcard, QuizAttempt } from "../types";

import type {
  StudyRoadmapLink,
  StudyRoadmapNode,
  StudyRoadmapNodeProgress,
  StudyRoadmapProgress,
} from "../types/roadmap";

export function buildRoadmapChildren(nodes: StudyRoadmapNode[]) {
  const children = new Map<string | undefined, StudyRoadmapNode[]>();

  for (const node of nodes) {
    const group = children.get(node.parentId) ?? [];
    group.push(node);
    children.set(node.parentId, group);
  }

  for (const group of children.values()) {
    group.sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
  }

  return children;
}

export function getRoadmapDescendantNodes(nodeId: string, nodes: StudyRoadmapNode[]) {
  const children = buildRoadmapChildren(nodes);
  const result: StudyRoadmapNode[] = [];
  const pending = [...(children.get(nodeId) ?? [])];

  while (pending.length > 0) {
    const current = pending.shift();
    if (!current) continue;
    result.push(current);
    pending.push(...(children.get(current.id) ?? []));
  }

  return result;
}

export function getRoadmapLeafNodes(nodes: StudyRoadmapNode[]) {
  const parentIds = new Set(nodes.flatMap((node) => (node.parentId ? [node.parentId] : [])));
  return nodes.filter((node) => !parentIds.has(node.id));
}

export function getRoadmapNodeProgress(nodes: StudyRoadmapNode[]): StudyRoadmapNodeProgress {
  const leaves = getRoadmapLeafNodes(nodes);
  const completed = leaves.filter((node) => node.completed).length;
  const total = leaves.length;

  return {
    total,
    completed,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function getRoadmapProgress(roadmapId: string, nodes: StudyRoadmapNode[]): StudyRoadmapProgress {
  return { roadmapId, ...getRoadmapNodeProgress(nodes) };
}

export function setRoadmapNodeCompletion(
  nodeId: string,
  completed: boolean,
  nodes: StudyRoadmapNode[],
  now = new Date().toISOString(),
) {
  const target = nodes.find((node) => node.id === nodeId);
  if (!target) return nodes;

  const affectedIds = new Set([nodeId, ...getRoadmapDescendantNodes(nodeId, nodes).map((node) => node.id)]);
  return nodes.map((node) =>
    affectedIds.has(node.id)
      ? { ...node, completed, completedAt: completed ? now : undefined, updatedAt: now }
      : node,
  );
}

export function moveRoadmapNode(nodeId: string, direction: "up" | "down", nodes: StudyRoadmapNode[], now = new Date().toISOString()) {
  const target = nodes.find((node) => node.id === nodeId);
  if (!target) return nodes;
  const siblings = nodes.filter((node) => node.roadmapId === target.roadmapId && node.parentId === target.parentId).sort((left, right) => left.order - right.order);
  const index = siblings.findIndex((node) => node.id === nodeId);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= siblings.length) return nodes;
  const swapped = siblings[nextIndex];
  return nodes.map((node) => {
    if (node.id === target.id) return { ...node, order: swapped.order, updatedAt: now };
    if (node.id === swapped.id) return { ...node, order: target.order, updatedAt: now };
    return node;
  });
}

export function getRoadmapNodeAncestors(nodeId: string, nodes: StudyRoadmapNode[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const ancestors: StudyRoadmapNode[] = [];
  let current = byId.get(nodeId);

  while (current?.parentId) {
    current = byId.get(current.parentId);
    if (current) ancestors.push(current);
  }

  return ancestors;
}

export interface RoadmapMaterialProgress {
  total: number;
  completed: number;
  percentage: number;
  flashcardsTotal: number;
  flashcardsCompleted: number;
  questionsTotal: number;
  questionsAnswered: number;
}

export function getRoadmapMaterialProgress(links: StudyRoadmapLink[], cards: Flashcard[], attempts: QuizAttempt[], nodeIds?: string[]): RoadmapMaterialProgress {
  const scopedNodeIds = nodeIds ? new Set(nodeIds) : null;
  const unique = new Map<string, StudyRoadmapLink>();
  links.filter((link) => !scopedNodeIds || scopedNodeIds.has(link.nodeId)).forEach((link) => unique.set(link.resourceType + ":" + link.resourceId, link));
  const cardMap = new Map(cards.map((card) => [card.id, card]));
  const flashcardLinks = Array.from(unique.values()).filter((link) => link.resourceType === "flashcard");
  const questionLinks = Array.from(unique.values()).filter((link) => link.resourceType === "quiz-question");
  const flashcardsCompleted = flashcardLinks.filter((link) => {
    const card = cardMap.get(link.resourceId);
    return Boolean(card && (card.repetitions > 0 || card.lastReviewAt));
  }).length;
  const questionsAnswered = questionLinks.filter((link) => attempts.some((attempt) => Object.prototype.hasOwnProperty.call(attempt.answers, link.resourceId))).length;
  const total = flashcardLinks.length + questionLinks.length;
  const completed = flashcardsCompleted + questionsAnswered;
  return { total, completed, percentage: total ? Math.round((completed / total) * 100) : 0, flashcardsTotal: flashcardLinks.length, flashcardsCompleted, questionsTotal: questionLinks.length, questionsAnswered };
}

export function normalizeRoadmapLinks<T extends { resourceType: string; resourceId: string }>(links: T[]) {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = link.resourceType + ":" + link.resourceId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

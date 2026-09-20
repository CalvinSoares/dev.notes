export type StudyRoadmapStatus = "draft" | "active" | "completed" | "archived";

export type StudyRoadmapNodeKind = "topic" | "subtopic";

export type StudyRoadmapResourceType = "flashcard" | "quiz-question" | "diagram";

export interface StudyRoadmap {
  id: string;
  title: string;
  description?: string;
  objective?: string;
  status: StudyRoadmapStatus;
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyRoadmapNode {
  id: string;
  roadmapId: string;
  parentId?: string;
  kind: StudyRoadmapNodeKind;
  title: string;
  description?: string;
  notes?: string;
  order: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyRoadmapLink {
  id: string;
  nodeId: string;
  resourceType: StudyRoadmapResourceType;
  resourceId: string;
  order: number;
  createdAt: string;
}

export interface StudyRoadmapNodeProgress {
  total: number;
  completed: number;
  percentage: number;
}

export interface StudyRoadmapProgress extends StudyRoadmapNodeProgress {
  roadmapId: string;
}

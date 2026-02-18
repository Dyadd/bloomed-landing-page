export type NodeCategory = 'foundational' | 'pathological' | 'clinical' | 'specialty';

export type GraphPhase = 'ambient' | 'diagnostic' | 'repair' | 'solidify';

export interface GraphNode {
  id: string;
  label: string;
  category: NodeCategory;
  x: number;
  y: number;
  isGapSource?: boolean;
  isGapTarget?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  isBroken?: boolean;
}

export type NodeCategory = 'foundational' | 'pathological' | 'clinical' | 'specialty';

export type GraphPhase = 'ambient' | 'diagnostic' | 'learning' | 'solidify';

export interface GraphNode {
  id: string;
  label: string;
  category: NodeCategory;
  x: number;
  y: number;
  group?: 'known';
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

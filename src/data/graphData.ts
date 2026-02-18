import type { GraphNode, GraphEdge } from './graphTypes';

// SVG viewport: 740 x 500
// Positions are pre-computed for a natural clustered layout -
// no force simulation needed, which keeps things predictable for animation.

export const GRAPH_NODES: GraphNode[] = [
  // Foundational Sciences - bottom-left cluster
  { id: 'anatomy',      label: 'Anatomy',      category: 'foundational', x: 110, y: 400, group: 'known' },
  { id: 'histology',    label: 'Histology',    category: 'foundational', x: 90,  y: 285 },
  { id: 'physiology',   label: 'Physiology',   category: 'foundational', x: 200, y: 290, group: 'known' },
  { id: 'biochemistry', label: 'Biochemistry', category: 'foundational', x: 285, y: 385 },

  // Pathological Sciences - center cluster
  { id: 'pathology',    label: 'Pathology',    category: 'pathological', x: 380, y: 220 },
  { id: 'pharmacology', label: 'Pharmacology', category: 'pathological', x: 420, y: 370, group: 'known' },
  { id: 'microbiology', label: 'Microbiology', category: 'pathological', x: 300, y: 450 },
  { id: 'immunology',   label: 'Immunology',   category: 'pathological', x: 490, y: 445, group: 'known' },

  // Clinical Sciences - center-right cluster
  // Note: label uses \n for two-line rendering in the SVG
  { id: 'clinicalReasoning',  label: 'Clinical\nReasoning',  category: 'clinical', x: 540, y: 185 },
  { id: 'diagnosis',          label: 'Diagnosis',            category: 'clinical', x: 590, y: 310, group: 'known' },
  { id: 'treatmentPlanning',  label: 'Tx. Planning',         category: 'clinical', x: 555, y: 430 },

  // Specialties - right cluster
  { id: 'internalMedicine', label: 'Internal Med.', category: 'specialty', x: 660, y: 180 },
  { id: 'surgery',          label: 'Surgery',        category: 'specialty', x: 670, y: 315 },
];

export const GRAPH_EDGES: GraphEdge[] = [
  // Foundational connections
  { id: 'anatomy-physiology',       source: 'anatomy',      target: 'physiology' },
  { id: 'anatomy-histology',        source: 'anatomy',      target: 'histology' },
  { id: 'physiology-biochemistry',  source: 'physiology',   target: 'biochemistry' },
  { id: 'physiology-pathology',     source: 'physiology',   target: 'pathology' },
  { id: 'biochemistry-pharmacology',source: 'biochemistry', target: 'pharmacology' },

  // Pathological connections
  { id: 'pathology-microbiology',       source: 'pathology',    target: 'microbiology' },
  { id: 'microbiology-immunology',      source: 'microbiology', target: 'immunology' },
  { id: 'pharmacology-treatmentPlanning', source: 'pharmacology', target: 'treatmentPlanning' },

  // Cross-cluster connections
  { id: 'pathology-clinicalReasoning', source: 'pathology', target: 'clinicalReasoning' },

  // Clinical connections
  { id: 'clinicalReasoning-diagnosis',        source: 'clinicalReasoning', target: 'diagnosis' },
  { id: 'clinicalReasoning-internalMedicine', source: 'clinicalReasoning', target: 'internalMedicine' },
  { id: 'diagnosis-treatmentPlanning',        source: 'diagnosis',         target: 'treatmentPlanning' },
  { id: 'diagnosis-surgery',                  source: 'diagnosis',         target: 'surgery' },
];

// Disparate known nodes - scattered across the graph to show fragmented knowledge
export const KNOWN_NODE_IDS = new Set([
  'anatomy',       // bottom-left
  'physiology',    // left
  'pharmacology',  // center
  'diagnosis',     // right
  'immunology',    // bottom-right
]);

/**
 * Classify an edge based on endpoint groups:
 *  - "known"    = both endpoints are known (solid in diagnostic)
 *  - "learning" = at least one endpoint is unknown (dotted in learning phase)
 */
export function classifyEdge(edge: GraphEdge): 'known' | 'learning' {
  const srcKnown = KNOWN_NODE_IDS.has(edge.source);
  const tgtKnown = KNOWN_NODE_IDS.has(edge.target);
  if (srcKnown && tgtKnown) return 'known';
  return 'learning';
}

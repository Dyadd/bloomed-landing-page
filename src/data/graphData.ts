import type { GraphNode, GraphEdge } from './graphTypes';

// SVG viewport: 740 × 500
// Positions are pre-computed for a natural clustered layout —
// no force simulation needed, which keeps things predictable for animation.

export const GRAPH_NODES: GraphNode[] = [
  // Foundational Sciences — bottom-left cluster
  { id: 'anatomy',      label: 'Anatomy',      category: 'foundational', x: 110, y: 400 },
  { id: 'histology',    label: 'Histology',    category: 'foundational', x: 90,  y: 285 },
  { id: 'physiology',   label: 'Physiology',   category: 'foundational', x: 200, y: 290 },
  { id: 'biochemistry', label: 'Biochemistry', category: 'foundational', x: 285, y: 385 },

  // Pathological Sciences — center cluster
  { id: 'pathology',    label: 'Pathology',    category: 'pathological', x: 380, y: 220, isGapSource: true },
  { id: 'pharmacology', label: 'Pharmacology', category: 'pathological', x: 420, y: 370 },
  { id: 'microbiology', label: 'Microbiology', category: 'pathological', x: 300, y: 450 },
  { id: 'immunology',   label: 'Immunology',   category: 'pathological', x: 490, y: 445 },

  // Clinical Sciences — center-right cluster
  // Note: label uses \n for two-line rendering in the SVG
  { id: 'clinicalReasoning',  label: 'Clinical\nReasoning',  category: 'clinical', x: 540, y: 185, isGapTarget: true },
  { id: 'diagnosis',          label: 'Diagnosis',            category: 'clinical', x: 590, y: 310 },
  { id: 'treatmentPlanning',  label: 'Tx. Planning',         category: 'clinical', x: 555, y: 430 },

  // Specialties — right cluster
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

  // ── THE BROKEN EDGE ── the gap Bloomed diagnoses and fixes
  { id: 'pathology-clinicalReasoning', source: 'pathology', target: 'clinicalReasoning', isBroken: true },

  // Clinical connections
  { id: 'clinicalReasoning-diagnosis',        source: 'clinicalReasoning', target: 'diagnosis' },
  { id: 'clinicalReasoning-internalMedicine', source: 'clinicalReasoning', target: 'internalMedicine' },
  { id: 'diagnosis-treatmentPlanning',        source: 'diagnosis',         target: 'treatmentPlanning' },
  { id: 'diagnosis-surgery',                  source: 'diagnosis',         target: 'surgery' },
];

// Convenience constants used by the animation module
export const GAP_SOURCE_ID = 'pathology';
export const GAP_TARGET_ID = 'clinicalReasoning';
export const BROKEN_EDGE_ID = 'pathology-clinicalReasoning';

// Pre-computed length of the broken edge for stroke-dashoffset animation
const src = GRAPH_NODES.find(n => n.id === GAP_SOURCE_ID)!;
const tgt = GRAPH_NODES.find(n => n.id === GAP_TARGET_ID)!;
export const BROKEN_EDGE_LENGTH = Math.round(
  Math.sqrt(Math.pow(tgt.x - src.x, 2) + Math.pow(tgt.y - src.y, 2))
);

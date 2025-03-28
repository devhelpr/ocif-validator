import { OCIFJson, Node, Relation } from '../types/ocif'

type Resource = NonNullable<OCIFJson['resources']>[number];
type Representation = NonNullable<Resource['representations']>[number];

// Helper function to get text from linked resource
const getNodeText = (node: NonNullable<OCIFJson['nodes']>[string], resources?: OCIFJson['resources']): string => {
  // First check if there's a direct text property
  if (typeof node.text === 'string') return node.text;
  
  // Then check if there's a resource reference
  if (node.resource && resources) {
    const resource = resources.find((r: Resource) => r.id === node.resource);
    if (resource) {
      // Find the first text/plain representation
      const textRep = resource.representations?.find((rep: Representation) => rep['mime-type'] === 'text/plain');
      if (textRep?.content) return textRep.content;
    }
  }
  
  return 'Node';
};

// Helper function to get node style from data
const getNodeStyle = (node: NonNullable<OCIFJson['nodes']>[string]): Node['style'] => {
  const nodeData = node.data?.[0];
  return {
    type: nodeData?.type === '@ocwg/node/oval' ? 'oval' as const : 'rectangle' as const,
    strokeWidth: nodeData?.strokeWidth || 2,
    strokeColor: nodeData?.strokeColor || '#64748b',
    fillColor: nodeData?.fillColor || '#f8fafc'
  };
};

export function generateSVG(json: OCIFJson): string {
  const width = 1200;
  const height = 800;
  const padding = 50;
  const nodeSpacing = 100;
  
  // Extract nodes and their properties
  const nodes: Node[] = [];
  const relations: Relation[] = [];

  // Process nodes from the OCIF data
  if (json.nodes) {
    Object.entries(json.nodes).forEach(([, node], index) => {
      const nodeWidth = node.size?.[0] || 120;
      const nodeHeight = node.size?.[1] || 60;
      
      // Use position from node data or calculate grid position
      const x = node.position?.[0] || (padding + (index % 3) * (nodeWidth + nodeSpacing));
      const y = node.position?.[1] || (padding + Math.floor(index / 3) * (nodeHeight + nodeSpacing));

      if (node.data?.[0]?.type !== "@ocwg/node/arrow") {
        const style = getNodeStyle(node);
        nodes.push({
          id: node.id,
          type: style.type,
          width: nodeWidth,
          height: nodeHeight,
          x,
          y,
          text: getNodeText(node, json.resources),
          style
        });
      }
    });
  }

  // Process relations
  if (json.relations) {
    json.relations.forEach(relationGroup => {
      relationGroup.data.forEach(relation => {
        // Find nodes by string ID
        const fromNode = nodes.find(n => n.id === relation.start);
        const toNode = nodes.find(n => n.id === relation.end);
        
        if (fromNode && toNode) {
          // Calculate control points for curved path using position array
          const fromX = fromNode.x + fromNode.width / 2;
          const fromY = fromNode.y + fromNode.height / 2;
          const toX = toNode.x + toNode.width / 2;
          const toY = toNode.y + toNode.height / 2;
          
          // Create a curved path
          const dx = toX - fromX;
          const controlPoint1X = fromX + dx * 0.5;
          const controlPoint1Y = fromY;
          const controlPoint2X = toX - dx * 0.5;
          const controlPoint2Y = toY;
          
          const path = `M ${fromX} ${fromY} 
                       C ${controlPoint1X} ${controlPoint1Y}, 
                         ${controlPoint2X} ${controlPoint2Y}, 
                         ${toX} ${toY}`;
          
          relations.push({ 
            from: relation.start, 
            to: relation.end, 
            path,
            type: relation.type,
            rel: relation.rel
          });
        }
      });
    });
  }

  // Generate SVG content
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="100%" height="100%" fill="#ffffff"/>
  
  <!-- Arrow marker definition -->
  <defs>
    <marker
      id="arrowhead"
      markerWidth="10"
      markerHeight="7"
      refX="9"
      refY="3.5"
      orient="auto"
    >
      <polygon
        points="0 0, 10 3.5, 0 7"
        fill="#94a3b8"
      />
    </marker>
  </defs>
  
  <!-- Relations (drawn first so they appear behind nodes) -->
  ${relations.map(relation => `
    <path 
      d="${relation.path}"
      stroke="#94a3b8"
      stroke-width="2"
      fill="none"
      marker-end="url(#arrowhead)"
      title="${relation.type} (${relation.rel})"
    />
  `).join('\n')}
  
  <!-- Nodes -->
  ${nodes.map(node => `
    <!-- ${node.type} node -->
    ${node.type === 'oval' 
      ? `<ellipse
          cx="${node.x + node.width/2}"
          cy="${node.y + node.height/2}"
          rx="${node.width/2}"
          ry="${node.height/2}"
          fill="${node.style.fillColor}"
          stroke="${node.style.strokeColor}"
          stroke-width="${node.style.strokeWidth}"
        />`
      : `<rect
          x="${node.x}"
          y="${node.y}"
          width="${node.width}"
          height="${node.height}"
          fill="${node.style.fillColor}"
          stroke="${node.style.strokeColor}"
          stroke-width="${node.style.strokeWidth}"
          rx="8"
          ry="8"
        />`
    }
    
    <!-- Node text -->
    <text
      x="${node.x + node.width/2}"
      y="${node.y + node.height/2}"
      font-family="Arial"
      font-size="14"
      fill="#1e293b"
      text-anchor="middle"
      dominant-baseline="middle"
    >${node.text}</text>
  `).join('\n')}
</svg>`;
} 
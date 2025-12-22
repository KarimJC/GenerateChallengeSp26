import data from './BigTestCase.json';

interface Sensor {
  id: number;
  dependencies: number[];
}

interface Risk {
  fromSensor: number;
  toSensor: number;
  risk: number;
}

interface Edge {
  from: number;
  to: number;
}

interface PathResult {
  distance: number;
  path: number[];
}

interface TargetPathInfo {
  target: number;
  path: number[];
  risk: number;
  root: number;
}

const solveHeist = (sensors: Sensor[], risks: Risk[], targetSensors: number[]): number[][] => {
  // Build adjacency list
  const graph: Map<number, number[]> = new Map();
  sensors.forEach(sensor => graph.set(sensor.id, []));
  
  sensors.forEach(sensor => {
    sensor.dependencies.forEach(dep => {
      graph.get(dep)?.push(sensor.id);
    });
  });
  
  // Build risk map
  const riskMap: Map<Edge, number> = new Map();
  risks.forEach(risk => {
    const edge: Edge = { from: risk.fromSensor, to: risk.toSensor };
    riskMap.set(edge, risk.risk);
  });
  
  const getRisk = (from: number, to: number): number => {
    // Find the edge in the map
    for (const [edge, risk] of riskMap) {
      if (edge.from === from && edge.to === to) {
        return risk;
      }
    }
    return 0;
  };
  
  const setRisk = (from: number, to: number, value: number): void => {
    // Find and update the edge
    for (const [edge, _] of riskMap) {
      if (edge.from === from && edge.to === to) {
        riskMap.set(edge, value);
        return;
      }
    }
    // If edge doesn't exist, create it
    riskMap.set({ from, to }, value);
  };
  
  // Find root sensors
  const roots = sensors
    .filter(s => s.dependencies.length === 0)
    .map(s => s.id)
    .sort((a, b) => a - b);
  
  // Dijkstra's algorithm
  const dijkstra = (start: number, target: number): PathResult | null => {
    const distances: Map<number, number> = new Map();
    const visited: Set<number> = new Set();
    const pq: [number, number, number[]][] = [[0, start, [start]]];
    
    sensors.forEach(s => distances.set(s.id, Infinity));
    distances.set(start, 0);
    
    while (pq.length > 0) {
      pq.sort((a, b) => {
        if (a[0] !== b[0]) return a[0] - b[0];
        return a[2].join(',').localeCompare(b[2].join(','));
      });
      
      const [dist, node, path] = pq.shift()!;
      
      if (visited.has(node)) continue;
      visited.add(node);
      
      if (node === target) {
        return { distance: dist, path };
      }
      
      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (visited.has(neighbor)) continue;
        
        const risk = getRisk(node, neighbor);
        const newDist = dist + risk;
        
        if (newDist < distances.get(neighbor)!) {
          distances.set(neighbor, newDist);
          pq.push([newDist, neighbor, [...path, neighbor]]);
        } else if (newDist === distances.get(neighbor)) {
          pq.push([newDist, neighbor, [...path, neighbor]]);
        }
      }
    }
    
    return null;
  };
  
  // Find best path from any root to target
  const findBestPathToTarget = (target: number): TargetPathInfo | null => {
    let bestPath: number[] | null = null;
    let bestRisk = Infinity;
    let bestRoot: number | null = null;
    
    for (const root of roots) {
      const result = dijkstra(root, target);
      
      if (result) {
        if (result.distance < bestRisk || 
            (result.distance === bestRisk && root < bestRoot!)) {
          bestPath = result.path;
          bestRisk = result.distance;
          bestRoot = root;
        }
      }
    }
    
    return bestPath ? { target, path: bestPath, risk: bestRisk, root: bestRoot! } : null;
  };
  
  // Main algorithm: choose lowest-risk target each time
  const paths: number[][] = [];
  const remainingTargets = new Set(targetSensors);
  
  while (remainingTargets.size > 0) {
    let bestOption: TargetPathInfo | null = null;
    let bestRisk = Infinity;
    let bestTarget: number | null = null;
    
    for (const target of remainingTargets) {
      const pathInfo = findBestPathToTarget(target);
      
      if (pathInfo) {
        if (pathInfo.risk < bestRisk || 
            (pathInfo.risk === bestRisk && target < bestTarget!)) {
          bestOption = pathInfo;
          bestRisk = pathInfo.risk;
          bestTarget = target;
        }
      }
    }
    
    if (bestOption) {
      paths.push(bestOption.path);
      remainingTargets.delete(bestOption.target);
      
      // Zero out risks along path
      for (let i = 0; i < bestOption.path.length - 1; i++) {
        setRisk(bestOption.path[i], bestOption.path[i + 1], 0);
      }
    } else {
      break;
    }
  }
  
  return paths;
};

// Run the algorithm
const { sensors, risks, targetSensors } = data;
const result = solveHeist(sensors, risks, targetSensors);

console.log(JSON.stringify({ paths: result }, null, 2));
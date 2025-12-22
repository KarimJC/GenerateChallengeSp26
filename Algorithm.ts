import data from './BigTestCase.json';
import { MinPriorityQueue } from '@datastructures-js/priority-queue';

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
  dist: number;
  path: number[];
}

interface TargetPathInfo {
  target: number;
  path: number[];
  risk: number;
  root: number;
}

const solveHeist = (sensors: Sensor[], risks: Risk[], targetSensors: number[]): number[][] => {
   
  const graph: Map<number, number[]> = new Map();
  sensors.forEach(sensor => graph.set(sensor.id, []));
  
  sensors.forEach(sensor => {
    sensor.dependencies.forEach(dep => {
      graph.get(dep).push(sensor.id);
    });
  });


 const riskMap: Map<string, number> = new Map();
  risks.forEach(risk => {
    const key = `${risk.fromSensor},${risk.toSensor}`;
    riskMap.set(key, risk.risk);
  });
  
  const getRisk = (from: number, to: number): number => {
    return riskMap.get(`${from},${to}`) ?? 0;
  };
  
  const setRisk = (from: number, to: number, value: number): void => {
    riskMap.set(`${from},${to}`, value);
  };

  const roots: number[] = sensors
    .filter(s => s.dependencies.length === 0)
    .map(s => s.id)
    .sort((a, b) => a - b);
  

  const dijkstra = (start: number, target: number): PathResult | null => {
    const distances: Map<number, number> = new Map();
    const visited: Set<number> = new Set();
    const pq = new MinPriorityQueue<{ dist: number; node: number; path: number[] }>({
        compare: (a, b) => {
            if (a.dist !== b.dist) {
                return a.dist - b.dist; // sort by distance
            }
            return a.path.join(',').localeCompare(b.path.join(','));
            //compares the strings of the path lists lexicographically
        }
    });

    sensors.forEach(sensor => distances.set(sensor.id, Infinity));

    pq.enqueue({ dist: 0, node: start, path: [start] });

    while(!pq.isEmpty()) {
        const { dist, node, path } = pq.dequeue();

        if (visited.has(node)) {
            continue;
        }

        visited.add(node);

        if (node === target) {
            return {dist: dist,
                path: path
            }
        }

        const neighbors = graph.get(node) || [];

        for (const n of neighbors) {
            if (visited.has(n)) {
                continue;
            }

            const newDist = getRisk(node, n) + dist;

            if (newDist < distances.get(n)) {
                distances.set(n, newDist);
                pq.enqueue({ dist: newDist, node: n, path: [...path, n]})
            } else if (newDist === distances.get(n)) {
                pq.enqueue({ dist: newDist, node: n, path: [...path, n]}) 
                //important for identifying which path to include if they are the same weight
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
        if (result.dist < bestRisk || 
            (result.dist === bestRisk && root < bestRoot!)) {
          bestPath = result.path;
          bestRisk = result.dist;
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
import data from './BigTestCase.json';
import { MinPriorityQueue } from '@datastructures-js/priority-queue';


/**
 * Sensor and its dependencies from the source data.
 */
interface Sensor {
  id: number;
  dependencies: number[];
}

/**
 * Represents Risk from one target to another in the source data.
 */
interface Risk {
  fromSensor: number;
  toSensor: number;
  risk: number;
}

/**
 * Represents information about the best path to a given target.
 */
interface TargetPathInfo {
  target: number;
  path: number[];
  risk: number;
}

/**
 * Iterably finds the cheapest path from any root to any target, zeroing out the path and
 * removing the target from the search until every target has been reached.
 * 
 * @param sensors The sensors that will make up the graph.
 * @param risks The risks (weights/distances) from one node to another.
 * @param targetSensors The ids of the sensors that are targets.
 * @returns 
 */
export const solveHeist = (sensors: Sensor[], risks: Risk[], targetSensors: number[]): number[][] => {
   
  /**
   * Graph is a map from a node to all of its neighbors.
   */
  const graph: Map<number, number[]> = new Map();
  sensors.forEach(sensor => graph.set(sensor.id, []));
  
  /**
   * Each sensor relies on its dependencies. So each dependency for this sensor points 
   * to this sensor, so the current sensor needs to be added to neighbors list of 
   * each dependency.
   */
  sensors.forEach(sensor => {
    sensor.dependencies.forEach(dep => {
      graph.get(dep).push(sensor.id);
    });
  });


  /**
   * The risk map uses a string representing the "from" and "to" nodes so that
   * retrieval is easier because if you create an object, you have to iterate over keys.
   */
 const riskMap: Map<string, number> = new Map();
  risks.forEach(risk => {
    const key : string = `${risk.fromSensor},${risk.toSensor}`;
    riskMap.set(key, risk.risk);
  });
  
  /**
   * Gets the risk from one node to another if it exists, otherwise returns 0.
   * 
   * @param from the starting node.
   * @param to the ending node.
   * @returns the risk between the two nodes.
   */
  const getRisk = (from: number, to: number): number => {
    return riskMap.get(`${from},${to}`) ?? 0;
  };
  
  /**
   * Sets the risk between two nodes.
   * 
   * @param from the starting node.
   * @param to the ending node.
   * @param value the value being set for the risk.
   */
  const setRisk = (from: number, to: number, value: number): void => {
    riskMap.set(`${from},${to}`, value);
  };

  /**
   * The sensors that have no dependencies and therefore roots.
   */
  const roots: number[] = sensors
    .filter(s => s.dependencies.length === 0)
    .map(s => s.id)
    .sort((a, b) => a - b);
  

  /**
   * Performs dijkstra's algorithm on the graph of sensors (nodes) in the museum
   * starting from all of the roots and finding the shortest path from any root to 
   * the target.
   * 
   * @param target The target node of dijkstra's
   * 
   * @returns The risk from the start to the target and the shortest path from any 
   * root to the target. Ties for lowest risk were resolved by choosing the 
   * path with the smaller ids going from front to back 
   * (EX: [1, 12, 13, 14] beats [1, 13, 12, 14])
   */  
  const multiRootDijkstra = (target: number): TargetPathInfo | null => {
    const risks: Map<number, number> = new Map();
    const visited: Set<number> = new Set();
    const pq = new MinPriorityQueue<{ risk: number; node: number; path: number[] }>({
        compare: (a, b) => {
            if (a.risk !== b.risk) {
                return a.risk - b.risk;
            }
            return a.path.join(',').localeCompare(b.path.join(','));
            //compares the strings of the path lists lexicographically
        }
    });

    sensors.forEach(sensor => risks.set(sensor.id, Infinity));

    for (const root of roots) {
      pq.enqueue({ risk: 0, node: root, path: [root] });
      risks.set(root, 0);
    }

    while(!pq.isEmpty()) {
        const { risk, node, path } = pq.dequeue();

        if (visited.has(node)) {
            continue;
        }

        visited.add(node);

        if (node === target) {
            return {
                target,
                path: path,
                risk,
            }
        }

        const neighbors : number[] = graph.get(node) || [];

        for (const n of neighbors) {
            if (visited.has(n)) {
                continue;
            }

            const newRisk : number = getRisk(node, n) + risk;

            if (newRisk < risks.get(n)) {
                risks.set(n, newRisk);
                pq.enqueue({ risk: newRisk, node: n, path: [...path, n]})
            } else if (newRisk === risks.get(n)) {
                pq.enqueue({ risk: newRisk, node: n, path: [...path, n]}) 
                //important for identifying which path to include if they are the same weight
            }
        }
    }
    return null;
  };
  
  const paths: number[][] = [];
  const remainingTargets = new Set(targetSensors);
  
  while (remainingTargets.size > 0) {
    let minPath: TargetPathInfo | null = null;
    let minRisk : number = Infinity;
    let bestTarget: number | null = null;
    
    for (const target of remainingTargets) {
      const pathInfo : TargetPathInfo = multiRootDijkstra(target);
      
      if (pathInfo) {
        if (pathInfo.risk < minRisk || 
            (pathInfo.risk === minRisk && target < bestTarget!)) {
          minPath = pathInfo;
          minRisk = pathInfo.risk;
          bestTarget = target;
        }
      }
    }
    
    if (minPath) {
      paths.push(minPath.path);
      remainingTargets.delete(minPath.target);
      
      for (let i = 0; i < minPath.path.length - 1; i++) {
        setRisk(minPath.path[i], minPath.path[i + 1], 0);
      }
    } else {
      break;
    }
  }
  
  return paths;
};

const { sensors, risks, targetSensors } = data;
const result = solveHeist(sensors, risks, targetSensors);

console.log(JSON.stringify({ "paths": result }));
import { solveHeist } from "./Algorithm";

describe("Museum Heist Algorithm Tests", () => {

    describe('Basic Path Finding', () => {
        it('Find best paths in small test case', () => {
            const sensors = [
                { id: 0, dependencies: [] },
                { id: 1, dependencies: [] },
                { id: 2, dependencies: [0, 1] },
                { id: 3, dependencies: [0, 1] },
                { id: 4, dependencies: [2, 3] },
                { id: 5, dependencies: [2, 3] },
                { id: 6, dependencies: [4, 5] }
            ];

            const risks = [
                { fromSensor: 0, toSensor: 2, risk: 5 },
                { fromSensor: 1, toSensor: 2, risk: 3 },
                { fromSensor: 0, toSensor: 3, risk: 4 },
                { fromSensor: 1, toSensor: 3, risk: 6 },
                { fromSensor: 2, toSensor: 4, risk: 2 },
                { fromSensor: 3, toSensor: 4, risk: 3 },
                { fromSensor: 2, toSensor: 5, risk: 4 },
                { fromSensor: 3, toSensor: 5, risk: 2 },
                { fromSensor: 4, toSensor: 6, risk: 1 },
                { fromSensor: 5, toSensor: 6, risk: 1 }
            ];

            const targetSensors = [4, 5, 6];
            const result = solveHeist(sensors, risks, targetSensors);

            expect(result).toEqual([
                [1, 2, 4],
                [1, 2, 4, 6],
                [1, 2, 5]
            ]);
        });
    });

    describe('Tie-Breaking', () => {
        it('should use smaller ID when paths have equal cost', () => {
            const sensors = [
                { id: 0, dependencies: [] },
                { id: 1, dependencies: [] },
                { id: 2, dependencies: [0, 1] }
            ];

            const risks = [
                { fromSensor: 0, toSensor: 2, risk: 5 },
                { fromSensor: 1, toSensor: 2, risk: 5 }
            ];

            const targetSensors = [2];
            const result = solveHeist(sensors, risks, targetSensors);

            expect(result).toEqual([[0, 2]]);
        });

        it('Should use the path that has the smallest ID first for the overall path', () => {
            const sensors = [
                { id: 0, dependencies: [] },
                { id: 1, dependencies: [0] },
                { id: 2, dependencies: [0] },
                { id: 3, dependencies: [1, 2] }
            ];

            const risks = [
                { fromSensor: 0, toSensor: 1, risk: 1 },
                { fromSensor: 0, toSensor: 2, risk: 2 },
                { fromSensor: 1, toSensor: 3, risk: 2 },
                { fromSensor: 2, toSensor: 3, risk: 1 }
            ];

            const targetSensors = [3];
            const result = solveHeist(sensors, risks, targetSensors);

            // Both paths cost 3, but [0,1,3] comes before [0,2,3]
            expect(result).toEqual([[0, 1, 3]]);
        });
    });

    describe('Path zeroing', () => {
        it('should reuse zeroed edges for cheaper future paths', () => {
            const sensors = [
                { id: 0, dependencies: [] },
                { id: 1, dependencies: [0] },
                { id: 2, dependencies: [1] },
                { id: 3, dependencies: [1] }
            ];

            const risks = [
                { fromSensor: 0, toSensor: 1, risk: 10 },
                { fromSensor: 1, toSensor: 2, risk: 5 },
                { fromSensor: 1, toSensor: 3, risk: 5 }
            ];

            const targetSensors = [2, 3];
            const result = solveHeist(sensors, risks, targetSensors);

            expect(result).toEqual([
                [0, 1, 2],
                [0, 1, 3]
            ]);
        });
    });
});
import { buildCatalog, removeFromList, renameInList } from './exercise-catalog';

const set = (weightKg: number, reps: number, technique = 'normal') => ({ setNumber: 1, weightKg, reps, technique });

describe('exercise-catalog', () => {
    it('une rotinas e registros sem duplicar por acento ou caixa', () => {
        const catalog = buildCatalog(
            [{ createdAt: '2026-01-02', exercises: [{ name: 'supino', category: 'Peito' }, { name: 'Rosca', category: 'Braços' }] }],
            [{ date: '2026-01-01', completedAt: '2026-01-01', exercises: [{ exerciseName: 'Supino', sets: [set(60, 10)] }] }],
        );
        expect(catalog.map((c) => c.name)).toEqual(['Rosca', 'Supino']);
        const supino = catalog.find((c) => c.name === 'Supino');
        expect(supino?.category).toBe('Peito');
        expect(supino?.timesLogged).toBe(1);
    });

    it('exercicio so da rotina entra sem historico', () => {
        const [rosca] = buildCatalog([{ exercises: [{ name: 'Rosca' }] }], []);
        expect(rosca).toMatchObject({ timesLogged: 0, lastDate: null, lastSets: [], personalBestKg: 0 });
    });

    it('ultima carga vem do registro mais recente e o recorde ignora aquecimento', () => {
        const [supino] = buildCatalog([], [
            { date: '2026-01-05', completedAt: '2026-01-05', exercises: [{ exerciseName: 'Supino', sets: [set(70, 8)] }] },
            { date: '2026-01-01', completedAt: '2026-01-01', exercises: [{ exerciseName: 'supino', sets: [set(100, 15, 'warmup'), set(60, 10)] }] },
        ]);
        expect(supino.name).toBe('supino'); // nome da primeira vez
        expect(supino.lastDate).toBe('2026-01-05');
        expect(supino.lastSets[0].weightKg).toBe(70);
        expect(supino.personalBestKg).toBe(70);
        expect(supino.timesLogged).toBe(2);
    });

    it('renomeia so quando muda e troca so de caixa reescreve o nome', () => {
        const items = [{ name: 'Supino' }, { name: 'Rosca' }];
        const get = (i: { name: string }) => i.name;
        const withName = (i: { name: string }, name: string) => ({ ...i, name });
        expect(renameInList(items, 'supino', 'SUPINO', get, withName)).toEqual([{ name: 'SUPINO' }, { name: 'Rosca' }]);
        expect(renameInList(items, 'Supino', 'Supino', get, withName)).toBeNull();
        expect(renameInList(items, 'Agachamento', 'X', get, withName)).toBeNull();
    });

    it('remove pelo nome normalizado', () => {
        const items = [{ name: 'Tríceps' }, { name: 'Rosca' }];
        expect(removeFromList(items, 'triceps', (i) => i.name)).toEqual([{ name: 'Rosca' }]);
        expect(removeFromList(items, 'x', (i) => i.name)).toBeNull();
    });
});

import { advanceMatch, BracketMatchShell, generateSingleEliminationBracket } from './tournament-bracket.util';

function makeEntries(n: number) {
  return Array.from({ length: n }, (_, i) => ({ entryId: `team-${i}` }));
}

function testIdGen() {
  let n = 0;
  return () => `id-${++n}`;
}

describe('generateSingleEliminationBracket', () => {
  it.each([2, 3, 4, 5, 8])('produces bracketSize-1 matches for %i teams', (n) => {
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
    const matches = generateSingleEliminationBracket(makeEntries(n), testIdGen());
    expect(matches).toHaveLength(bracketSize - 1);
  });

  it.each([2, 3, 4, 5, 8])('gives each round the right match count for %i teams', (n) => {
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
    const roundCount = Math.log2(bracketSize);
    const matches = generateSingleEliminationBracket(makeEntries(n), testIdGen());
    const byRound: Record<number, BracketMatchShell[]> = {};
    for (const m of matches) (byRound[m.round] ||= []).push(m);
    for (let r = 1; r <= roundCount; r++) {
      expect(byRound[r]).toHaveLength(bracketSize / Math.pow(2, r));
    }
  });

  it('never leaves a round-1 match with both slots empty', () => {
    for (const n of [2, 3, 4, 5, 8]) {
      const matches = generateSingleEliminationBracket(makeEntries(n), testIdGen());
      const round1 = matches.filter((m) => m.round === 1);
      expect(round1.every((m) => m.teamAEntryId || m.teamBEntryId)).toBe(true);
    }
  });

  it('auto-advances byes and cascades the winner into the next round slot', () => {
    // n=3 -> bracketSize=4 -> 1 bye
    const matches = generateSingleEliminationBracket(makeEntries(3), testIdGen());
    const round1 = matches.filter((m) => m.round === 1);
    const bye = round1.find((m) => m.status === 'completed' && !m.teamBEntryId)!;
    expect(bye).toBeDefined();
    expect(bye.winnerEntryId).toBe(bye.teamAEntryId);
    const next = matches.find((m) => m.id === bye.nextMatchId)!;
    const slotValue = bye.nextMatchSlot === 'a' ? next.teamAEntryId : next.teamBEntryId;
    expect(slotValue).toBe(bye.winnerEntryId);
  });

  it('rejects fewer than 2 entries', () => {
    expect(() => generateSingleEliminationBracket(makeEntries(1), testIdGen())).toThrow();
    expect(() => generateSingleEliminationBracket([], testIdGen())).toThrow();
  });
});

describe('advanceMatch', () => {
  it('plays out an entire 4-team bracket to a single champion', () => {
    const matches = generateSingleEliminationBracket(makeEntries(4), testIdGen());
    let round = 1;
    while (true) {
      const ready = matches.filter((m) => m.round === round && m.status === 'ready');
      if (!ready.length) {
        if (!matches.some((m) => m.round === round)) break;
        round++;
        if (round > 2) break;
        continue;
      }
      for (const m of ready) advanceMatch(matches, m.id, 5, 3);
    }
    const final = matches.find((m) => !m.nextMatchId)!;
    expect(final.status).toBe('completed');
    expect(final.winnerEntryId).toBeDefined();
  });

  it('rejects a tied score', () => {
    const matches = generateSingleEliminationBracket(makeEntries(4), testIdGen());
    const ready = matches.find((m) => m.status === 'ready')!;
    expect(() => advanceMatch(matches, ready.id, 3, 3)).toThrow();
  });

  it('rejects reporting a match that is not ready', () => {
    const matches = generateSingleEliminationBracket(makeEntries(4), testIdGen());
    const pending = matches.find((m) => m.status === 'pending')!;
    expect(() => advanceMatch(matches, pending.id, 5, 3)).toThrow();
  });

  it('rejects an unknown match id', () => {
    const matches = generateSingleEliminationBracket(makeEntries(4), testIdGen());
    expect(() => advanceMatch(matches, 'not-a-real-id', 5, 3)).toThrow();
  });
});

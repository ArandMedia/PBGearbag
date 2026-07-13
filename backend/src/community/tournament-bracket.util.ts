import { randomUUID } from 'crypto';

export interface BracketEntryInput { entryId:string; seed?:number }
export interface BracketMatchShell {
  id:string; round:number; matchNumber:number;
  teamAEntryId?:string; teamBEntryId?:string;
  teamAScore?:number; teamBScore?:number; winnerEntryId?:string;
  nextMatchId?:string; nextMatchSlot?:'a'|'b';
  status:'pending'|'ready'|'completed';
}

function nextPowerOfTwo(n:number){let p=1;while(p<n)p*=2;return p}

// Builds the full single-elimination tree in one pass ("build the tree
// first, fill leaves"): every round's match shells are created and linked
// via nextMatchId/nextMatchSlot up front, then round 1 is seeded from the
// given (already ordered/seeded) entries. Byes go to the top `bracketSize-n`
// entries by list order — since byes are always fewer than the number of
// round-1 matches, no match ever ends up with two byes. A bye match
// auto-completes and its winner is cascaded one level into round 2
// immediately (the only round that can inherit a walkover; every later
// round is decided by an actual reported result).
export function generateSingleEliminationBracket(entries:BracketEntryInput[],idGenerator:()=>string=randomUUID):BracketMatchShell[]{
  const n=entries.length;
  if(n<2)throw new Error('At least 2 entries are required to start a bracket');
  const bracketSize=nextPowerOfTwo(n);
  const roundCount=Math.log2(bracketSize);
  const roundsMatches:BracketMatchShell[][]=[];
  const matches:BracketMatchShell[]=[];

  for(let r=1;r<=roundCount;r++){
    const count=bracketSize/Math.pow(2,r);
    const shells:BracketMatchShell[]=[];
    for(let i=0;i<count;i++)shells.push({id:idGenerator(),round:r,matchNumber:i+1,status:'pending'});
    roundsMatches.push(shells);
    matches.push(...shells);
  }

  for(let r=0;r<roundCount-1;r++){
    const thisRound=roundsMatches[r],nextRound=roundsMatches[r+1];
    thisRound.forEach((m,i)=>{
      const next=nextRound[Math.floor(i/2)];
      m.nextMatchId=next.id;
      m.nextMatchSlot=i%2===0?'a':'b';
    });
  }

  const byes=bracketSize-n;
  const round1=roundsMatches[0];
  let idx=0;
  round1.forEach((m,i)=>{
    if(i<byes){
      const a=entries[idx++];
      m.teamAEntryId=a.entryId; m.winnerEntryId=a.entryId; m.status='completed';
    }else{
      const a=entries[idx++],b=entries[idx++];
      m.teamAEntryId=a.entryId; m.teamBEntryId=b.entryId; m.status='ready';
    }
  });

  if(roundCount>1){
    for(const m of round1){
      if(m.status!=='completed'||!m.nextMatchId)continue;
      const next=matches.find(x=>x.id===m.nextMatchId)!;
      if(m.nextMatchSlot==='a')next.teamAEntryId=m.winnerEntryId;else next.teamBEntryId=m.winnerEntryId;
      if(next.teamAEntryId&&next.teamBEntryId)next.status='ready';
    }
  }

  return matches;
}

// Reports a result for a 'ready' match, advancing the winner into the slot
// its nextMatchId/nextMatchSlot points at (mutates and returns the same
// array — callers persist whatever rows changed).
export function advanceMatch(matches:BracketMatchShell[],matchId:string,teamAScore:number,teamBScore:number):BracketMatchShell[]{
  const match=matches.find(m=>m.id===matchId);
  if(!match)throw new Error('Match not found');
  if(!match.teamAEntryId||!match.teamBEntryId)throw new Error('Match is not ready — both teams must be set');
  if(teamAScore===teamBScore)throw new Error('Match cannot end in a tie');
  match.teamAScore=teamAScore; match.teamBScore=teamBScore;
  match.winnerEntryId=teamAScore>teamBScore?match.teamAEntryId:match.teamBEntryId;
  match.status='completed';
  if(match.nextMatchId){
    const next=matches.find(m=>m.id===match.nextMatchId)!;
    if(match.nextMatchSlot==='a')next.teamAEntryId=match.winnerEntryId;else next.teamBEntryId=match.winnerEntryId;
    if(next.teamAEntryId&&next.teamBEntryId)next.status='ready';
  }
  return matches;
}

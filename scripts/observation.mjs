// Observation ceilings belong to test tooling, never to the game's ball lifecycle.
export function diagnoseObservation(snapshot,wallSeconds,simSeconds){
 const d=snapshot.diagnostics;
 if(d?.visibility==='hidden')return 'background';
 if(snapshot.paused)return 'paused';
 if(d&&d.wall-d.lastFrame>2000)return 'frame-stall';
 if(snapshot.progress?.sinceHit>=60)return 'no-progress';
 if(wallSeconds>=10&&simSeconds/wallSeconds<.5)return 'slow-simulation';
 return 'long-active-flight';
}

// Instrumental adaptation from the supplied reference: quantized vocal contour,
// octave-normalized and arranged for a pulse lead, triangle bass and marching drums.
// This score contains no samples or vocals from the recording.
export const ANTHEM_BPM=116;
export const ANTHEM_NOTES=[
 [69,.25],[71,.25],[73,1],[72,.5],[77,1],[75,1],[73,1],[72,.5],[69,1],
 [69,.5],[71,.25],[73,.75],[72,.25],[71,1],[70,1],[71,.5],[72,.75],[70,1],
 [69,.5],[71,.25],[73,1],[72,.75],[74,1],[73,1],[72,.75],[69,1],
 [70,.75],[73,1],[72,.5],[0,.5],
 [69,.5],[67,1],[71,1.25],[75,1],[75,.5],[72,.5],[75,.5],[72,.5],
 [69,.5],[78,1.25],[67,1],[68,1.25],[71,.75],[68,1],[69,1],
 [71,.5],[72,.5],[69,1],[71,1.5],[73,2]
];
export const ANTHEM_DURATION=ANTHEM_NOTES.reduce((sum,[,beats])=>sum+beats,0)*60/ANTHEM_BPM;

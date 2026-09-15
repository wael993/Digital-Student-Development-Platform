export type StopLike = { id: string; sequence: number };
export type SegmentLike = { fromStopId: string; toStopId: string; estimatedMinutes: number };

export function remainingStops(currentStopSequence: number, childStopSequence: number): number {
  return Math.max(0, childStopSequence - currentStopSequence);
}

export function remainingMinutes(
  stops: StopLike[],
  segments: SegmentLike[],
  currentStopSequence: number,
  childStopSequence: number,
): number {
  if (childStopSequence <= currentStopSequence) {
    return 0;
  }
  const ordered = [...stops].sort((a, b) => a.sequence - b.sequence);
  const fromSeq = currentStopSequence === 0 ? (ordered[0]?.sequence ?? 0) : currentStopSequence;
  const chain = ordered.filter(
    (stop) => stop.sequence >= fromSeq && stop.sequence <= childStopSequence,
  );
  if (currentStopSequence === 0 && ordered[0] && chain[0]?.id !== ordered[0].id) {
    chain.unshift(ordered[0]);
  }
  let minutes = 0;
  for (let i = 0; i < chain.length - 1; i += 1) {
    const fromId = chain[i].id;
    const toId = chain[i + 1].id;
    const segment = segments.find((row) => row.fromStopId === fromId && row.toStopId === toId);
    minutes += segment?.estimatedMinutes ?? 0;
  }
  return minutes;
}

export function calculateEta(input: {
  stops: StopLike[];
  segments: SegmentLike[];
  currentStopSequence: number;
  childStopSequence: number;
}): {
  currentStopSequence: number;
  childStopSequence: number;
  stopsRemaining: number;
  estimatedMinutes: number;
} {
  return {
    currentStopSequence: input.currentStopSequence,
    childStopSequence: input.childStopSequence,
    stopsRemaining: remainingStops(input.currentStopSequence, input.childStopSequence),
    estimatedMinutes: remainingMinutes(
      input.stops,
      input.segments,
      input.currentStopSequence,
      input.childStopSequence,
    ),
  };
}

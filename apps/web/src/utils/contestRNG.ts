// 🎲 COMMIT-REVEAL RNG SYSTEM für faires Gewinnspiel
// Basierend auf Server-seitigem Commit-Reveal Schema

/**
 * Generate a commit hash for RNG
 * In production, this would be done server-side
 */
export const generateCommit = (seed: string): string => {
  // Simple hash function (in production, use crypto)
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

/**
 * Generate reveal value
 * In production, this would be done server-side after commit phase
 */
export const generateReveal = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Verify commit-reveal pair
 */
export const verifyCommitReveal = (commit: string, reveal: string): boolean => {
  const expectedCommit = generateCommit(reveal);
  return commit === expectedCommit;
};

/**
 * Generate random number from commit-reveal pair
 */
export const generateRandomFromCommitReveal = (
  commit: string,
  reveal: string,
  max: number
): number => {
  if (!verifyCommitReveal(commit, reveal)) {
    throw new Error('Invalid commit-reveal pair');
  }
  
  // Combine commit and reveal for seed
  const combined = commit + reveal;
  let seed = 0;
  for (let i = 0; i < combined.length; i++) {
    seed = ((seed << 5) - seed) + combined.charCodeAt(i);
    seed = seed & seed;
  }
  
  // Generate random number
  const random = Math.abs(seed) / Math.pow(2, 31);
  return Math.floor(random * max);
};

/**
 * Contest RNG Phase
 */
export enum ContestRNGPhase {
  COMMIT = 'commit',
  REVEAL = 'reveal',
  FINALIZED = 'finalized'
}

/**
 * Contest RNG State
 */
export interface ContestRNGState {
  phase: ContestRNGPhase;
  commitHash: string | null;
  revealValue: string | null;
  participants: string[];
  winners: { participantId: string; position: number; prize: number }[] | null;
  auditLog: Array<{
    timestamp: number;
    action: string;
    data: any;
  }>;
}

/**
 * Initialize contest RNG
 */
export const initializeContestRNG = (participants: string[]): ContestRNGState => {
  return {
    phase: ContestRNGPhase.COMMIT,
    commitHash: null,
    revealValue: null,
    participants,
    winners: null,
    auditLog: [{
      timestamp: Date.now(),
      action: 'contest_initialized',
      data: { participantCount: participants.length }
    }]
  };
};

/**
 * Generate commit phase (server-side)
 */
export const generateCommitPhase = (revealSeed: string): string => {
  const commit = generateCommit(revealSeed);
  return commit;
};

/**
 * Generate winners from finalized RNG
 */
export const generateWinners = (
  participants: string[],
  commitHash: string,
  revealValue: string,
  prizeCount: number
): { participantId: string; position: number; prize: number }[] => {
  if (!verifyCommitReveal(commitHash, revealValue)) {
    throw new Error('Invalid commit-reveal verification failed');
  }
  
  const winners: { participantId: string; position: number; prize: number }[] = [];
  const availableParticipants = [...participants];
  
  for (let position = 1; position <= prizeCount && availableParticipants.length > 0; position++) {
    const randomIndex = generateRandomFromCommitReveal(
      commitHash,
      revealValue + position, // Different seed for each position
      availableParticipants.length
    );
    
    const winnerId = availableParticipants.splice(randomIndex, 1)[0];
    winners.push({
      participantId: winnerId,
      position,
      prize: prizeCount - position + 1 // Prize amount based on position
    });
  }
  
  return winners;
};

/**
 * Audit log entry
 */
export const addAuditLogEntry = (
  state: ContestRNGState,
  action: string,
  data: any
): ContestRNGState => {
  return {
    ...state,
    auditLog: [
      ...state.auditLog,
      {
        timestamp: Date.now(),
        action,
        data
      }
    ]
  };
};


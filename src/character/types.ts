export type CharacterState =
  | 'idle'
  | 'listen'
  | 'think'
  | 'talk'
  | 'laugh'
  | 'surprised'
  | 'confused'
  | 'happy'
  | 'angry';

export type Viseme =
  | 'rest'
  | 'A'
  | 'E'
  | 'I'
  | 'O'
  | 'U'
  | 'M'
  | 'F'
  | 'L'
  | 'wide';

export interface CharacterPose {
  headTilt: number;
  headNod: number;
  eyeOpenL: number;
  eyeOpenR: number;
  lookX: number;
  lookY: number;
  mouthOpen: number;
  mouthWidth: number;
  browRaise: number;
  browFurrow: number;
  earTwitch: number;
  bodyBob: number;
  armSwing: number;
}

export const REST_POSE: CharacterPose = {
  headTilt: 0,
  headNod: 0,
  eyeOpenL: 1,
  eyeOpenR: 1,
  lookX: 0,
  lookY: 0,
  mouthOpen: 0.08,
  mouthWidth: 0.45,
  browRaise: 0,
  browFurrow: 0,
  earTwitch: 0,
  bodyBob: 0,
  armSwing: 0,
};

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPose(a: CharacterPose, b: CharacterPose, t: number): CharacterPose {
  const out = { ...REST_POSE };
  (Object.keys(REST_POSE) as (keyof CharacterPose)[]).forEach((key) => {
    out[key] = lerp(a[key], b[key], t);
  });
  return out;
}

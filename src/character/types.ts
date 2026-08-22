export type CharacterState =
  | 'idle'
  | 'read'
  | 'listen'
  | 'think'
  | 'talk'
  | 'laugh'
  | 'surprised'
  | 'confused'
  | 'happy'
  | 'angry'
  | 'phone'
  | 'eat'
  | 'drink'
  | 'burp'
  | 'poke'
  | 'fall'
  | 'lab';

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

export type SceneId = 'living' | 'lab';

export interface CharacterPose {
  headTilt: number;
  headNod: number;
  headShake: number;
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
  armL: number;
  armR: number;
  phoneToEar: number;
  paperUp: number;
  tongueOut: number;
  soot: number;
}

export const REST_POSE: CharacterPose = {
  headTilt: 0,
  headNod: 0,
  headShake: 0,
  eyeOpenL: 1,
  eyeOpenR: 1,
  lookX: 0,
  lookY: 0,
  mouthOpen: 0.06,
  mouthWidth: 0.42,
  browRaise: 0,
  browFurrow: 0.1,
  earTwitch: 0,
  bodyBob: 0,
  armL: 0,
  armR: 0,
  phoneToEar: 0,
  paperUp: 0,
  tongueOut: 0,
  soot: 0,
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

/** Classic phone-call short lines (original recordings, not proprietary assets). */
export type BenLineId = 'ben' | 'yes' | 'no' | 'ugh' | 'ha_ha_ha' | 'ah' | 'ow' | 'ouch' | 'hmm';

export const PHONE_LINES: BenLineId[] = ['ben', 'yes', 'no', 'ugh', 'ha_ha_ha'];

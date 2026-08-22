import { CharacterPose, CharacterState, REST_POSE, Viseme } from '../character/types';

export class AnimationController {
  poseForState(state: CharacterState): CharacterPose {
    const p: CharacterPose = { ...REST_POSE };
    switch (state) {
      case 'idle':
        return p;
      case 'listen':
        p.headTilt = 0.25;
        p.browRaise = 0.35;
        p.earTwitch = 0.4;
        p.mouthOpen = 0.05;
        return p;
      case 'think':
        p.headTilt = -0.2;
        p.lookY = -0.15;
        p.browFurrow = 0.35;
        p.mouthOpen = 0.02;
        return p;
      case 'talk':
        p.headNod = 0.15;
        p.mouthOpen = 0.45;
        p.armSwing = 0.2;
        return p;
      case 'laugh':
        p.headNod = 0.4;
        p.mouthOpen = 0.75;
        p.mouthWidth = 0.7;
        p.eyeOpenL = 0.55;
        p.eyeOpenR = 0.55;
        p.bodyBob = 0.5;
        return p;
      case 'surprised':
        p.browRaise = 1;
        p.mouthOpen = 0.85;
        p.mouthWidth = 0.35;
        p.eyeOpenL = 1.15;
        p.eyeOpenR = 1.15;
        return p;
      case 'confused':
        p.headTilt = 0.45;
        p.browFurrow = 0.5;
        p.browRaise = 0.2;
        p.mouthOpen = 0.15;
        p.mouthWidth = 0.3;
        return p;
      case 'happy':
        p.mouthWidth = 0.75;
        p.mouthOpen = 0.25;
        p.eyeOpenL = 0.7;
        p.eyeOpenR = 0.7;
        p.browRaise = 0.2;
        return p;
      case 'angry':
        p.browFurrow = 1;
        p.mouthOpen = 0.35;
        p.mouthWidth = 0.55;
        p.headNod = -0.1;
        return p;
      default:
        return p;
    }
  }

  sampleIdle(t: number, state: CharacterState): CharacterPose {
    const base = this.poseForState(state);
    base.bodyBob = Math.sin(t * 1.4) * 0.35;
    base.headNod = base.headNod + Math.sin(t * 0.9) * 0.08;
    base.earTwitch = Math.sin(t * 2.2) * 0.25;
    base.armSwing = Math.sin(t * 1.1) * 0.15;
    return base;
  }

  mouthForViseme(viseme: Viseme): { open: number; width: number } {
    switch (viseme) {
      case 'rest':
        return { open: 0.08, width: 0.45 };
      case 'A':
        return { open: 0.7, width: 0.55 };
      case 'E':
        return { open: 0.4, width: 0.7 };
      case 'I':
        return { open: 0.3, width: 0.65 };
      case 'O':
        return { open: 0.55, width: 0.35 };
      case 'U':
        return { open: 0.35, width: 0.28 };
      case 'M':
        return { open: 0.02, width: 0.4 };
      case 'F':
        return { open: 0.12, width: 0.5 };
      case 'L':
        return { open: 0.35, width: 0.45 };
      case 'wide':
        return { open: 0.6, width: 0.8 };
      default:
        return { open: 0.2, width: 0.45 };
    }
  }

  /** Map spoken text progress to approximate visemes */
  visemeFromText(text: string, progress: number): Viseme {
    const cleaned = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
    if (!cleaned.length) return 'rest';
    const idx = Math.min(cleaned.length - 1, Math.floor(progress * cleaned.length));
    const ch = cleaned[idx];
    if ('mbp'.includes(ch)) return 'M';
    if ('fv'.includes(ch)) return 'F';
    if ('l'.includes(ch)) return 'L';
    if ('a'.includes(ch)) return 'A';
    if ('e'.includes(ch)) return 'E';
    if ('i'.includes(ch)) return 'I';
    if ('o'.includes(ch)) return 'O';
    if ('u'.includes(ch)) return 'U';
    if (' '.includes(ch)) return 'rest';
    return 'wide';
  }
}

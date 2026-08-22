import { CharacterPose, CharacterState, REST_POSE, Viseme } from '../character/types';

export class AnimationController {
  poseForState(state: CharacterState): CharacterPose {
    const p: CharacterPose = { ...REST_POSE };
    switch (state) {
      case 'idle':
        return p;
      case 'read':
        p.paperUp = 1;
        p.lookY = -0.2;
        p.eyeOpenL = 0.85;
        p.eyeOpenR = 0.85;
        return p;
      case 'listen':
      case 'phone':
        p.phoneToEar = 1;
        p.headTilt = 0.12;
        p.browRaise = 0.2;
        p.armL = 1;
        return p;
      case 'think':
        p.headTilt = -0.2;
        p.browFurrow = 0.4;
        return p;
      case 'talk':
        p.phoneToEar = 1;
        p.armL = 1;
        p.headNod = 0.12;
        p.mouthOpen = 0.5;
        return p;
      case 'laugh':
        p.phoneToEar = 1;
        p.armL = 1;
        p.mouthOpen = 0.85;
        p.mouthWidth = 0.75;
        p.bodyBob = 0.55;
        p.headNod = 0.45;
        p.eyeOpenL = 0.55;
        p.eyeOpenR = 0.55;
        return p;
      case 'surprised':
        p.browRaise = 1;
        p.mouthOpen = 0.8;
        p.eyeOpenL = 1.2;
        p.eyeOpenR = 1.2;
        return p;
      case 'confused':
        p.headTilt = 0.4;
        p.browFurrow = 0.5;
        p.mouthOpen = 0.15;
        return p;
      case 'happy':
        p.mouthWidth = 0.7;
        p.mouthOpen = 0.25;
        p.eyeOpenL = 0.7;
        p.eyeOpenR = 0.7;
        return p;
      case 'angry':
        p.browFurrow = 1;
        p.headShake = 0.3;
        p.mouthOpen = 0.3;
        return p;
      case 'eat':
        p.armR = 1;
        p.mouthOpen = 0.45;
        p.headNod = 0.3;
        return p;
      case 'drink':
        p.armR = 1.2;
        p.headTilt = -0.35;
        p.mouthOpen = 0.35;
        return p;
      case 'burp':
        p.mouthOpen = 0.7;
        p.bodyBob = 0.4;
        return p;
      case 'poke':
        p.mouthOpen = 0.5;
        p.browRaise = 0.8;
        return p;
      case 'fall':
        p.headNod = 1;
        p.bodyBob = -1;
        p.mouthOpen = 0.6;
        p.eyeOpenL = 0.2;
        p.eyeOpenR = 0.2;
        return p;
      case 'lab':
        p.armR = 0.6;
        return p;
      default:
        return p;
    }
  }

  sampleIdle(t: number, state: CharacterState): CharacterPose {
    const base = this.poseForState(state);
    base.bodyBob = (base.bodyBob || 0) + Math.sin(t * 1.3) * 0.25;
    base.headNod = base.headNod + Math.sin(t * 0.85) * 0.06;
    base.earTwitch = Math.sin(t * 2.1) * 0.2;
    if (state === 'laugh') {
      base.headNod = 0.3 + Math.sin(t * 10) * 0.25;
      base.bodyBob = 0.4 + Math.abs(Math.sin(t * 8)) * 0.35;
    }
    if (state === 'angry' || state === 'no' as CharacterState) {
      base.headShake = Math.sin(t * 9) * 0.45;
    }
    return base;
  }

  mouthForViseme(viseme: Viseme): { open: number; width: number } {
    switch (viseme) {
      case 'rest':
        return { open: 0.06, width: 0.42 };
      case 'A':
        return { open: 0.72, width: 0.55 };
      case 'E':
        return { open: 0.4, width: 0.7 };
      case 'I':
        return { open: 0.3, width: 0.62 };
      case 'O':
        return { open: 0.55, width: 0.32 };
      case 'U':
        return { open: 0.35, width: 0.26 };
      case 'M':
        return { open: 0.02, width: 0.4 };
      case 'F':
        return { open: 0.12, width: 0.5 };
      case 'L':
        return { open: 0.35, width: 0.45 };
      case 'wide':
        return { open: 0.65, width: 0.8 };
      default:
        return { open: 0.2, width: 0.45 };
    }
  }

  visemeFromText(text: string, progress: number): Viseme {
    const cleaned = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
    if (!cleaned.length) return 'rest';
    const idx = Math.min(cleaned.length - 1, Math.floor(progress * cleaned.length));
    const ch = cleaned[idx];
    if ('mbp'.includes(ch)) return 'M';
    if ('fv'.includes(ch)) return 'F';
    if (ch === 'l') return 'L';
    if (ch === 'a') return 'A';
    if (ch === 'e') return 'E';
    if (ch === 'i') return 'I';
    if (ch === 'o') return 'O';
    if (ch === 'u') return 'U';
    if (ch === ' ') return 'rest';
    return 'wide';
  }
}

import type { TalkingBenAPI } from '../main/preload';

declare global {
  interface Window {
    talkingBen?: TalkingBenAPI;
  }
}

export {};

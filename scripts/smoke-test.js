'use strict';

/**
 * Smoke tests that validate module wiring without requiring a display/mic.
 */
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const required = [
  'main/main.js',
  'main/preload.js',
  'main/ipc.js',
  'renderer/index.html',
  'renderer/styles.css',
  'renderer/app.js',
  'character/CharacterController.js',
  'animation/AnimationController.js',
  'audio/AudioManager.js',
  'speech/SpeechProvider.js',
  'speech/WebSpeechProvider.js',
  'speech/VoicePipeline.js',
  'speech/VoiceActivityDetector.js',
  'tts/TTSProvider.js',
  'tts/WebTTSProvider.js',
  'conversation/ConversationProvider.js',
  'conversation/LocalBenConversation.js',
  'interaction/InteractionSystem.js',
  'settings/SettingsStore.js',
  'ui/MicIndicator.js',
  'ui/SettingsPanel.js',
];

let ok = true;
for (const rel of required) {
  const full = path.join(dist, rel);
  if (!fs.existsSync(full)) {
    console.error('Missing:', rel);
    ok = false;
  }
}
if (!ok) process.exit(1);

(async () => {
  try {
    const { LocalBenConversation } = require(path.join(dist, 'conversation/LocalBenConversation.js'));
    const conv = new LocalBenConversation();

    const samples = ['hello', 'tell me a joke', 'what is your name', 'goodbye', 'pizza'];
    for (const phrase of samples) {
      const reply = await conv.respond(phrase);
      if (!reply || typeof reply.text !== 'string' || !reply.emotion) {
        throw new Error(`Invalid response for "${phrase}"`);
      }
      console.log(`  "${phrase}" → ${reply.text} [${reply.emotion}]`);
    }

    const { AnimationController } = require(path.join(dist, 'animation/AnimationController.js'));
    const anim = new AnimationController();
    const pose = anim.poseForState('laugh');
    if (pose.mouthOpen < 0.5) throw new Error('Laugh pose mouthOpen too low');
    const viseme = anim.visemeFromText('hello', 0.2);
    if (!viseme) throw new Error('Viseme mapping failed');
    console.log('Animation poses/visemes OK');

    const { SettingsStore } = require(path.join(dist, 'settings/SettingsStore.js'));
    const settings = new SettingsStore();
    const defaults = settings.getAll();
    if (typeof defaults.volume !== 'number') {
      throw new Error('Settings defaults invalid');
    }
    if (defaults.telemetryEnabled !== false) {
      throw new Error('Telemetry must default to off');
    }
    console.log('Settings defaults OK');

    // Ensure package.json has no ad SDKs
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const name of Object.keys(deps)) {
      if (/admob|adsense|unity-ads|applovin/i.test(name)) {
        throw new Error(`Forbidden dependency: ${name}`);
      }
    }
    console.log('Dependency scan OK');
  } catch (err) {
    console.error('Module load failed:', err);
    process.exit(1);
  }

  console.log('✓ Smoke tests passed.');
})();

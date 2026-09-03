import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import { storage } from '@/lib/storage';

const SOUND_ENABLED_KEY = 'feedback.sound.enabled';
const HAPTICS_ENABLED_KEY = 'feedback.haptics.enabled';

export type FeedbackEvent =
  | 'selection'
  | 'cardSwipe'
  | 'softSuccess'
  | 'success'
  | 'error'
  | 'packCut'
  | 'packReveal';

const audioSources = {
  success: require('@/assets/audio/confirm.wav'),
  cardSwipe: require('@/assets/audio/card-slide.wav'),
  packCut: require('@/assets/audio/pack-tear.wav'),
  packReveal: require('@/assets/audio/card-reveal.wav'),
} as const;

const players = new Map<keyof typeof audioSources, AudioPlayer>();
let audioConfigured = false;

export function isSoundEnabled(): boolean {
  return storage.getBoolean(SOUND_ENABLED_KEY) ?? true;
}

export function isHapticsEnabled(): boolean {
  return storage.getBoolean(HAPTICS_ENABLED_KEY) ?? true;
}

export function setSoundEnabled(enabled: boolean): void {
  storage.set(SOUND_ENABLED_KEY, enabled);
}

export function setHapticsEnabled(enabled: boolean): void {
  storage.set(HAPTICS_ENABLED_KEY, enabled);
}

async function playSound(event: keyof typeof audioSources): Promise<void> {
  if (!isSoundEnabled()) return;
  if (!audioConfigured) {
    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
    audioConfigured = true;
  }
  let player = players.get(event);
  if (!player) {
    player = createAudioPlayer(audioSources[event]);
    players.set(event, player);
  }
  await player.seekTo(0);
  player.play();
}

async function playHaptic(event: FeedbackEvent): Promise<void> {
  if (!isHapticsEnabled()) return;
  switch (event) {
    case 'selection':
    case 'cardSwipe':
      await Haptics.selectionAsync();
      break;
    case 'softSuccess':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      break;
    case 'packCut':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'error':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'success':
    case 'packReveal':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
  }
}

export function triggerFeedback(event: FeedbackEvent): void {
  void Promise.all([
    playHaptic(event),
    event === 'success' || event === 'cardSwipe' || event === 'packCut' || event === 'packReveal'
      ? playSound(event)
      : Promise.resolve(),
  ]).catch(() => undefined);
}

export function previewSound(): void {
  void playSound('success').catch(() => undefined);
}

export function previewHaptics(): void {
  void playHaptic('selection').catch(() => undefined);
}

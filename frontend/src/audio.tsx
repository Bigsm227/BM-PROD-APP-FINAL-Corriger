import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";

import { mediaUrl, type Beat } from "@/src/api";

type AudioState = {
  current: Beat | null;
  playing: boolean;
  toggle: (beat: Beat) => void;
  stop: () => void;
};

const AudioContext = createContext<AudioState | undefined>(undefined);

export function AudioProvider({ children }: PropsWithChildren) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [current, setCurrent] = useState<Beat | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    if (status.didJustFinish) {
      try {
        player.seekTo(0);
        player.pause();
      } catch {
        // player may be released
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

  const toggle = (beat: Beat) => {
    if (!beat.preview_url) return;
    if (current?.id === beat.id) {
      if (status.playing) player.pause();
      else player.play();
      return;
    }
    player.replace({ uri: mediaUrl(beat.preview_url) });
    player.play();
    setCurrent(beat);
  };

  const stop = () => {
    try {
      player.pause();
    } catch {
      // ignore
    }
    setCurrent(null);
  };

  return (
    <AudioContext.Provider value={{ current, playing: status.playing, toggle, stop }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

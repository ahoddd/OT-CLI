/**
 * Seamless looping video background for landing, login, and signup.
 * Bottom cropped to remove watermark; slight zoom out; seamless loop; exposes play() for focus restore.
 */

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';

const videoSource = require('../assets/videos/background.mp4');

const containerStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  width: '100vw' as const,
  height: '100vh' as const,
  zIndex: 0,
  overflow: 'hidden' as const,
};

const overlayStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  width: '100vw' as const,
  height: '100vh' as const,
  zIndex: 1,
  pointerEvents: 'none' as const,
};

const OVERLAY_COLORS = ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)'] as const;

// Crop bottom (~12%) and zoom out slightly: show top/mid of video, fit screen. Optimized for web.
const WEB_VIDEO_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center 20%',
  transform: 'scale(0.96)',
  filter: 'brightness(0.8)',
  display: 'block',
};

export type LandingVideoBackgroundRef = { play: () => void };

function LandingVideoBackgroundInner(
  _: unknown,
  ref: React.Ref<LandingVideoBackgroundRef>
) {
  const videoRef = useRef<Video>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [webVideoUri, setWebVideoUri] = useState<string | null>(null);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);

  const play = () => {
    if (useFallback) return;
    if (Platform.OS === 'web') {
      const el = webVideoRef.current;
      if (el) {
        el.currentTime = 0;
        el.play().catch(() => {});
      }
      return;
    }
    videoRef.current?.playFromPositionAsync(0).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ play }), [useFallback]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(videoSource);
        await asset.downloadAsync();
        if (!cancelled && asset.localUri) setWebVideoUri(asset.localUri);
      } catch {
        if (!cancelled) setUseFallback(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (useFallback) return;
    if (Platform.OS === 'web') {
      const el = webVideoRef.current;
      if (el) el.play().catch(() => setUseFallback(true));
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    v.playFromPositionAsync(0).catch(() => setUseFallback(true));
    return () => {
      videoRef.current?.pauseAsync().catch(() => {});
    };
  }, [useFallback, webVideoUri]);

  const handleError = () => setUseFallback(true);

  const handleWebEnded = () => {
    const el = webVideoRef.current;
    if (el) {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View
        style={[styles.containerBase, containerStyle, styles.webContainer]}
        pointerEvents="none"
        className="video-background-container"
      >
        {useFallback ? (
          <View style={[styles.fallback, styles.fallbackFill]} />
        ) : webVideoUri ? (
          React.createElement('video', {
            ref: (el: HTMLVideoElement | null) => { webVideoRef.current = el; },
            src: webVideoUri,
            autoPlay: true,
            muted: true,
            loop: true,
            playsInline: true,
            disablePictureInPicture: true,
            preload: 'auto',
            decoding: 'async',
            style: WEB_VIDEO_STYLE,
            onError: handleError,
            onEnded: handleWebEnded,
          })
        ) : null}
        <LinearGradient
          colors={OVERLAY_COLORS}
          style={[styles.overlayFill, overlayStyle]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />
      </View>
    );
  }

  return (
    <View style={[styles.containerBase, styles.containerNative]} pointerEvents="none">
      {useFallback ? (
        <View style={[styles.fallback, StyleSheet.absoluteFill]} />
      ) : (
        <View style={styles.videoCropWrap}>
          <Video
            ref={videoRef}
            source={videoSource}
            style={styles.videoZoomCrop}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted
            shouldPlay
            positionMillis={0}
            onLoad={() => videoRef.current?.playFromPositionAsync(0).catch(() => {})}
            onError={handleError}
          />
        </View>
      )}
      <LinearGradient
        colors={OVERLAY_COLORS}
        style={[StyleSheet.absoluteFill, styles.overlayNative]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
    </View>
  );
}

export const LandingVideoBackground = forwardRef<LandingVideoBackgroundRef>(LandingVideoBackgroundInner);

const styles = StyleSheet.create({
  containerBase: { overflow: 'hidden' },
  webContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    minWidth: '100%',
    minHeight: '100%',
  },
  containerNative: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  videoCropWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  videoZoomCrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '115%',
    transform: [{ scale: 0.96 }],
  },
  fallback: { backgroundColor: '#0a0a0a' },
  fallbackFill: { width: '100%', height: '100%' },
  overlayFill: { ...StyleSheet.absoluteFillObject },
  overlayNative: { zIndex: 1 },
});

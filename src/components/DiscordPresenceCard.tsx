import React, { useEffect, useState } from 'react';
import { Disc3, Radio } from 'lucide-react';
import type { DiscordConfig } from '../types/profile';

interface LanyardData {
  discord_user: {
    id: string;
    username: string;
    global_name?: string;
    avatar?: string;
  };
  discord_status: 'online' | 'idle' | 'dnd' | 'offline';
  listening_to_spotify?: boolean;
  spotify?: {
    song: string;
    artist: string;
    timestamps?: {
      start: number;
      end: number;
    };
  };
  activities?: Array<{
    type: number;
    name: string;
    state?: string;
    details?: string;
    timestamps?: {
      start?: number;
    };
  }>;
}

function formatDurationSec(totalSec: number): string {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

export const DiscordPresenceCard: React.FC<{
  config: DiscordConfig;
  profileAvatarUrl: string;
  accentColor: string;
  onAvatarSynced?: (avatarUrl: string) => void;
}> = ({ config, profileAvatarUrl, accentColor, onAvatarSynced }) => {
  const [liveData, setLiveData] = useState<LanyardData | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [sessionSec, setSessionSec] = useState(848);

  // Live 1s clock for elapsed activity timer & Spotify progress bar
  useEffect(() => {
    const clock = window.setInterval(() => {
      setNowTick(Date.now());
      setSessionSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(clock);
  }, []);

  // Lanyard REST + Real-Time WebSocket (wss://api.lanyard.rest/socket)
  useEffect(() => {
    const uid = config.discordUserId.trim();
    if (!config.enabled || !config.useLanyardApi || !uid) {
      setLiveData(null);
      setWsConnected(false);
      return;
    }

    let cancelled = false;
    let ws: WebSocket | null = null;
    let heartbeatId: number | null = null;

    const applyPresence = (data: LanyardData) => {
      if (cancelled) return;
      setLiveData(data);
      if (config.syncAvatar && data.discord_user?.avatar && onAvatarSynced) {
        onAvatarSynced(
          `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.png?size=256`
        );
      }
    };

    // Initial REST fetch
    void fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(uid)}`)
      .then((r) => r.json())
      .then((json: { success?: boolean; data?: LanyardData }) => {
        if (json.success && json.data) applyPresence(json.data);
      })
      .catch(() => {});

    // Live WebSocket subscription
    try {
      ws = new WebSocket('wss://api.lanyard.rest/socket');
      ws.onmessage = (event) => {
        try {
          const pkt = JSON.parse(String(event.data)) as {
            op: number;
            t?: string;
            d?: { heartbeat_interval?: number } & LanyardData;
          };
          if (pkt.op === 1 && pkt.d?.heartbeat_interval && ws) {
            ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: uid } }));
            heartbeatId = window.setInterval(() => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ op: 3 }));
              }
            }, pkt.d.heartbeat_interval);
          } else if (
            pkt.op === 0 &&
            (pkt.t === 'INIT_STATE' || pkt.t === 'PRESENCE_UPDATE') &&
            pkt.d
          ) {
            setWsConnected(true);
            applyPresence(pkt.d);
          }
        } catch {
          // ignore malformed frames
        }
      };
    } catch {
      setWsConnected(false);
    }

    return () => {
      cancelled = true;
      if (heartbeatId !== null) window.clearInterval(heartbeatId);
      if (ws) {
        try {
          ws.close();
        } catch {
          // ignore close errors
        }
      }
    };
  }, [
    config.enabled,
    config.useLanyardApi,
    config.discordUserId,
    config.syncAvatar,
    onAvatarSynced,
  ]);

  if (!config.enabled) return null;

  const status = liveData?.discord_status || config.fallbackStatus;
  const username =
    liveData?.discord_user.global_name ||
    liveData?.discord_user.username ||
    config.fallbackUsername;

  const avatarSrc = liveData?.discord_user.avatar
    ? `https://cdn.discordapp.com/avatars/${liveData.discord_user.id}/${liveData.discord_user.avatar}.png?size=128`
    : profileAvatarUrl;

  const customAct = liveData?.activities?.find((a) => a.type === 4);
  const richAct = liveData?.activities?.find((a) => a.type !== 4);

  const customStatusText = customAct?.state || config.fallbackCustomStatus;
  const activityTitle = richAct?.name || config.fallbackActivityName;
  const activityDetail = richAct?.details || richAct?.state || config.fallbackActivityDetails;

  const liveElapsedSec = richAct?.timestamps?.start
    ? Math.max(0, Math.floor((nowTick - richAct.timestamps.start) / 1000))
    : sessionSec;

  const spotifyLine =
    liveData?.listening_to_spotify && liveData.spotify
      ? `${liveData.spotify.artist} — ${liveData.spotify.song}`
      : config.fallbackSpotifyTrack;

  let spotifyPct = ((sessionSec % 195) / 195) * 100;
  if (liveData?.spotify?.timestamps) {
    const { start, end } = liveData.spotify.timestamps;
    const span = Math.max(1, end - start);
    spotifyPct = Math.max(0, Math.min(100, ((nowTick - start) / span) * 100));
  }

  const statusColorMap: Record<string, string> = {
    online: '#6ab065',
    idle: '#d4913d',
    dnd: '#e04f33',
    offline: '#6e665b',
  };

  return (
    <div className="discord-presence-card">
      <div className="discord-mini-avatar-wrap">
        <img src={avatarSrc} alt={username} className="discord-mini-avatar" />
        <span
          className="discord-status-badge"
          style={{ backgroundColor: statusColorMap[status] || '#6ab065' }}
          title={`Discord: ${status.toUpperCase()}`}
        />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>{username}</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.66rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              opacity: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Radio size={11} style={{ color: accentColor }} />
            {wsConnected ? 'Lanyard Socket' : liveData ? 'Lanyard Live' : 'Rich Presence'}
          </span>
        </div>

        {customStatusText && (
          <div style={{ fontSize: '0.77rem', opacity: 0.78, marginTop: '0.1rem' }}>
            “{customStatusText}”
          </div>
        )}

        {activityTitle && (
          <div
            style={{
              marginTop: '0.32rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.71rem',
              opacity: 0.9,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span style={{ color: accentColor }}>▸</span> {activityTitle}
              {activityDetail ? ` · ${activityDetail}` : ''}
            </span>
            <span style={{ opacity: 0.68, flexShrink: 0 }}>
              {formatDurationSec(liveElapsedSec)}
            </span>
          </div>
        )}

        {spotifyLine && (
          <div style={{ marginTop: '0.32rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.69rem',
                color: '#8bc486',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <Disc3 size={12} /> {spotifyLine}
            </div>
            <div
              style={{
                marginTop: '0.22rem',
                height: 3,
                borderRadius: 99,
                background: 'rgba(242, 236, 225, 0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${spotifyPct.toFixed(1)}%`,
                  height: '100%',
                  background: '#6ab065',
                  transition: 'width 0.9s linear',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

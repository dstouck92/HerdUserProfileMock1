import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { supabase } from './lib/supabase';
import { GradientBg, Card, F, AvatarSprite } from './components/ui';

export default function PublicProfile({ username: usernameProp, embedded = false }) {
  const { username: usernameFromRoute } = useParams();
  const username = usernameProp ?? usernameFromRoute;
  const profileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [curateCards, setCurateCards] = useState([]);
  const [curatePrompts, setCuratePrompts] = useState([]);
  const [shareFeedback, setShareFeedback] = useState('');
  const [downloadFeedback, setDownloadFeedback] = useState('');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [badges, setBadges] = useState([]);
  const [badgeDefs, setBadgeDefs] = useState([]);

  const formatBadgeTitle = (b) => {
    const meta = b.metadata || {};
    const artistName = meta.artistName || meta.artist || null;
    const trackName = meta.trackName || meta.songName || null;
    const channelName = meta.channelName || null;
    const videoTitle = meta.title || null;

    switch (b.badge_key) {
      case 'fan_superfan_all_users_top_10':
        return artistName
          ? `Superfan of ${artistName} (all users)`
          : b.def.name;
      case 'fan_superfan_fan_club_top_10':
        return artistName
          ? `Superfan of ${artistName} (fan club)`
          : b.def.name;
      case 'streams_most_streamed_artist':
        return artistName
          ? `${artistName} – Most Streamed Artist`
          : b.def.name;
      case 'streams_most_streamed_song':
        return trackName
          ? `${trackName} – Most Streamed Song`
          : b.def.name;
      case 'yt_most_viewed_channel':
        return channelName
          ? `${channelName} – Most Viewed Channel`
          : b.def.name;
      case 'yt_most_viewed_video':
        return videoTitle
          ? `${videoTitle} – Most Viewed Video`
          : b.def.name;
      case 'tickets_groupie':
        return artistName
          ? `Groupie for ${artistName}`
          : b.def.name;
      case 'merch_collector':
        return artistName
          ? `Collector of ${artistName}`
          : b.def.name;
      default:
        return b.def.name;
    }
  };

  useEffect(() => {
    if (!supabase || !username) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        // 1) Find profile by username
        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_id, profile_image_url, age, gender, country, region, show_age_public, show_gender_public, show_location_public, public_profile_theme')
          .eq('username', username)
          .single();
        if (profError || !prof) {
          throw new Error('Profile not found.');
        }
        if (cancelled) return;
        setProfile(prof);

        // 2) Load curate cards, prompts, follows, badges
        const uid = prof.id;
        const [cardsRes, promptsRes, followsRes, userBadgesRes, badgeDefsRes] = await Promise.all([
          supabase.from('user_curate_cards').select('id, user_id, card_index, prompt_id, answer, updated_at').eq('user_id', uid).order('card_index', { ascending: true }),
          supabase.from('curate_prompts').select('id, category_id, slug, prompt_text, max_characters, answer_config, sort_order'),
          supabase
            .from('user_follows')
            .select('follower_id, followed_id')
            .or(`follower_id.eq.${uid},followed_id.eq.${uid}`),
          supabase.from('user_badges_public').select('badge_key, earned_at, metadata').eq('user_id', uid),
          supabase.from('badges').select('key, name, category, description, icon, sort_order').order('sort_order', { ascending: true }),
        ]);
        if (cancelled) return;
        if (cardsRes.data) setCurateCards(cardsRes.data);
        if (promptsRes.data) setCuratePrompts(promptsRes.data);
        if (badgeDefsRes.data) setBadgeDefs(badgeDefsRes.data);
        if (followsRes && !followsRes.error && followsRes.data) {
          const all = followsRes.data;
          const followers = all.filter((r) => r.followed_id === uid);
          const following = all.filter((r) => r.follower_id === uid);
          setFollowersCount(followers.length);
          setFollowingCount(following.length);
        } else {
          setFollowersCount(0);
          setFollowingCount(0);
        }
        if (userBadgesRes && !userBadgesRes.error && userBadgesRes.data && badgeDefsRes?.data) {
          const defByKey = {};
          badgeDefsRes.data.forEach((d) => {
            defByKey[d.key] = d;
          });
          const mapped = userBadgesRes.data
            .map((b) => {
              const def = defByKey[b.badge_key];
              if (!def) return null;
              return { ...b, def };
            })
            .filter(Boolean)
            .sort((a, b) => {
              const sa = a.def.sort_order ?? 0;
              const sb = b.def.sort_order ?? 0;
              if (sa !== sb) return sa - sb;
              return new Date(a.earned_at).getTime() - new Date(b.earned_at).getTime();
            });
          const seen = new Set();
          const unique = [];
          for (const b of mapped) {
            if (seen.has(b.badge_key)) continue;
            seen.add(b.badge_key);
            unique.push(b);
          }
          setBadges(unique);
        } else {
          setBadges([]);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (!supabase) {
    if (embedded) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: F, fontSize: 14, color: '#0f766e' }}>
        Public profiles require Supabase to be configured.
      </div>
    );
    }
    return (
      <GradientBg>
        <div style={{ padding: '80px 24px', textAlign: 'center', fontFamily: F, fontSize: 15, color: '#0f766e' }}>
          Public profiles require Supabase to be configured.
        </div>
      </GradientBg>
    );
  }

  if (loading) {
    if (embedded) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: F, fontSize: 14, color: '#0f766e' }}>
        Loading profile…
      </div>
    );
    }
    return (
      <GradientBg>
        <div style={{ padding: '80px 24px', textAlign: 'center', fontFamily: F, fontSize: 15, color: '#0f766e' }}>
          Loading profile…
        </div>
      </GradientBg>
    );
  }

  if (error || !profile) {
    if (embedded) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 6 }}>Profile not found</div>
        <div style={{ fontFamily: F, fontSize: 13, color: 'rgba(55,48,107,0.6)' }}>{error || 'This profile does not exist.'}</div>
      </div>
    );
    }
    return (
      <GradientBg>
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>Profile not found</div>
          <div style={{ fontFamily: F, fontSize: 14, color: 'rgba(55,48,107,0.6)' }}>{error || 'This profile does not exist.'}</div>
        </div>
      </GradientBg>
    );
  }

  const themeId = profile?.public_profile_theme || 'default';
  const THEMES = {
    default: { bg: 'linear-gradient(165deg, #e0f2fe 0%, #cffafe 22%, #ccfbf1 45%, #d1fae5 70%, #dcfce7 100%)', cardBg: 'rgba(255,255,255,0.65)', cardBorder: 'rgba(255,255,255,0.6)', text: '#1e1b4b', muted: 'rgba(55,48,107,0.6)', accent: '#0f766e', accentLight: 'rgba(16,185,129,0.08)' },
    white_red: { bg: 'linear-gradient(165deg, #fef2f2 0%, #fee2e2 30%, #fecaca 60%, #fca5a5 100%)', cardBg: 'rgba(255,255,255,0.85)', cardBorder: 'rgba(185,28,28,0.2)', text: '#1e1b4b', muted: 'rgba(127,29,29,0.7)', accent: '#b91c1c', accentLight: 'rgba(185,28,28,0.1)' },
    orange_blue: { bg: 'linear-gradient(165deg, #fff7ed 0%, #ffedd5 25%, #dbeafe 60%, #bfdbfe 100%)', cardBg: 'rgba(255,255,255,0.8)', cardBorder: 'rgba(234,88,12,0.25)', text: '#1e1b4b', muted: 'rgba(124,45,18,0.7)', accent: '#ea580c', accentLight: 'rgba(234,88,12,0.1)' },
    black_purple: { bg: 'linear-gradient(165deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #5b21b6 100%)', cardBg: 'rgba(255,255,255,0.08)', cardBorder: 'rgba(139,92,246,0.4)', text: '#e9d5ff', muted: 'rgba(233,213,255,0.7)', accent: '#a78bfa', accentLight: 'rgba(139,92,246,0.2)' },
    green_purple: { bg: 'linear-gradient(165deg, #dcfce7 0%, #bbf7d0 35%, #f3e8ff 70%, #e9d5ff 100%)', cardBg: 'rgba(255,255,255,0.75)', cardBorder: 'rgba(34,197,94,0.3)', text: '#1e1b4b', muted: 'rgba(55,48,107,0.6)', accent: '#16a34a', accentLight: 'rgba(34,197,94,0.12)' },
  };
  const theme = THEMES[themeId] || THEMES.default;
  const cardsWithPrompts = (curateCards || [])
    .filter((row) => row.prompt_id)
    .map((row) => {
      const prompt = (curatePrompts || []).find((p) => p.id === row.prompt_id);
      return { ...row, prompt };
    })
    .filter((c) => c.prompt)
    .sort((a, b) => a.card_index - b.card_index);
  const hasAnyCards = cardsWithPrompts.length > 0;

  const bioParts = [];
  if (profile.show_age_public && profile.age != null) {
    bioParts.push(`${profile.age}`);
  }
  if (profile.show_gender_public && profile.gender) {
    bioParts.push(profile.gender);
  }
  if (profile.show_location_public && (profile.country || profile.region)) {
    const loc = [profile.region, profile.country].filter(Boolean).join(', ');
    if (loc) bioParts.push(loc);
  }
  const bioLine = bioParts.length ? bioParts.join(' · ') : '';

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const handleShareLink = async () => {
    setShareFeedback('');
    try {
      if (navigator.share && navigator.canShare?.({ url: shareUrl })) {
        await navigator.share({
          title: `${profile?.display_name || 'Profile'} on Herd`,
          text: `Check out ${profile?.display_name || 'my'} profile`,
          url: shareUrl,
        });
        setShareFeedback('Shared!');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Link copied!');
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShareFeedback('Link copied!');
        } catch {
          setShareFeedback('Could not share');
        }
      }
    }
    setTimeout(() => setShareFeedback(''), 2000);
  };

  const handleDownload = async () => {
    if (!profileRef.current) return;
    setDownloadFeedback('');
    try {
      const canvas = await html2canvas(profileRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#dcfce7',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `herd-profile-${profile?.username || 'profile'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloadFeedback('Saved!');
    } catch (e) {
      setDownloadFeedback('Download failed');
    }
    setTimeout(() => setDownloadFeedback(''), 2000);
  };

  const shellStyle = embedded
    ? {
        paddingBottom: 8,
        background: theme.bg,
        minHeight: '100%',
        borderRadius: 18,
        overflow: 'hidden',
      }
    : {
        paddingBottom: 8,
        background: theme.bg,
        minHeight: '100vh',
      };

  const renderCardAnswer = (card) => {
    const answer = card.answer || {};
    const prompt = card.prompt;
    const config = prompt?.answer_config || {};
    const texts = answer.texts || [];
    const textTemplate = config.text_template;
    const textCount = config.text_input_count ?? 1;
    let mainText = '';
    if (textTemplate && texts.length >= textCount) {
      mainText = textTemplate.replace(/\{(\d+)\}/g, (_, i) => texts[Number(i)] ?? '');
    } else if (texts.length > 0) {
      mainText = texts[0] || '';
    }
    const dataRefs = answer.data_refs || [];
    const badgeKeys = answer.badges || [];
    const artists = answer.artists || [];
    const images = answer.images || [];
    const defByKey = (badgeDefs || []).reduce((acc, d) => { acc[d.key] = d; return acc; }, {});

    return (
      <div style={{ marginTop: 12 }}>
        {mainText && (
          <div style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: theme.text, lineHeight: 1.6, marginBottom: (dataRefs.length || badgeKeys.length || artists.length || images.length) ? 12 : 0 }}>
            {mainText}
          </div>
        )}
        {images.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
            {images.map((img, i) => (
              <img key={i} src={img.url} alt="" style={{ width: 96, height: 96, borderRadius: 12, objectFit: 'cover', border: `1px solid ${theme.accent}` }} />
            ))}
          </div>
        )}
        {dataRefs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {dataRefs.map((ref, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: theme.accentLight,
                  border: `1px solid ${theme.accent}`,
                  fontFamily: F,
                  fontSize: 12,
                  color: theme.text,
                }}
              >
                {ref.type === 'concert' && (ref.metadata?.artist || ref.metadata?.date) && `${ref.metadata.artist || ''} ${ref.metadata.date || ''}`.trim()}
                {ref.type === 'vinyl' && (ref.metadata?.artist_name || ref.metadata?.album_name) && `${ref.metadata.artist_name || ''} – ${ref.metadata.album_name || ''}`.trim()}
                {ref.type === 'merch' && (ref.metadata?.artist_name || ref.metadata?.item_name) && `${ref.metadata.artist_name || ''} – ${ref.metadata.item_name || ''}`.trim()}
                {ref.type === 'streaming' && ref.metadata?.name}
                {ref.type === 'youtube' && (ref.metadata?.channelTitle || ref.metadata?.channelId || 'YouTube')}
                {!['concert', 'vinyl', 'merch', 'streaming', 'youtube'].includes(ref.type) && '—'}
              </span>
            ))}
          </div>
        )}
        {badgeKeys.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {badgeKeys.map((key) => {
              const def = defByKey[key];
              if (!def) return null;
              return (
                <span
                  key={key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 9px',
                    borderRadius: 999,
                    background: theme.accentLight,
                    border: `1px solid ${theme.accent}`,
                    fontFamily: F,
                    fontSize: 11,
                    fontWeight: 600,
                    color: theme.text,
                  }}
                >
                  {def.icon || '🏅'} {def.name}
                </span>
              );
            })}
          </div>
        )}
        {artists.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {artists.map((a, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: theme.accentLight,
                  border: `1px solid ${theme.accent}`,
                  fontFamily: F,
                  fontSize: 12,
                  color: theme.text,
                }}
              >
                {typeof a === 'object' ? a.name : a}
              </span>
            ))}
          </div>
        )}
        {!mainText && dataRefs.length === 0 && badgeKeys.length === 0 && artists.length === 0 && images.length === 0 && (
          <div style={{ fontFamily: F, fontSize: 13, color: theme.muted }}>No answer yet.</div>
        )}
      </div>
    );
  };

  const inner = (
    <div
      ref={profileRef}
      style={shellStyle}
    >
        <div style={{ padding: '24px 20px 12px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <AvatarSprite avatarId={profile.avatar_id ?? 7} size={72} imageUrl={profile.profile_image_url} />
          <div>
            <div style={{ fontFamily: F, fontSize: 22, fontWeight: 800, color: theme.text }}>{profile.display_name}</div>
            <div style={{ fontFamily: F, fontSize: 13, color: theme.muted, marginTop: 2 }}>@{profile.username}</div>
            {bioLine && (
              <div style={{ fontFamily: F, fontSize: 12, color: theme.muted, marginTop: 4 }}>{bioLine}</div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontFamily: F, fontSize: 12, color: theme.muted }}>
              <span><strong style={{ color: theme.accent }}>{followersCount}</strong> followers</span>
              <span><strong style={{ color: theme.accent }}>{followingCount}</strong> following</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleShareLink}
              style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${theme.accent}`, background: theme.cardBg, fontFamily: F, fontSize: 14, fontWeight: 600, color: theme.accent, cursor: 'pointer' }}
            >
              Share
            </button>
            <button
              type="button"
              onClick={handleDownload}
              style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${theme.accent}`, background: theme.cardBg, fontFamily: F, fontSize: 14, fontWeight: 600, color: theme.accent, cursor: 'pointer' }}
            >
              Download
            </button>
            <span style={{ fontFamily: F, fontSize: 12, color: theme.accent }}>{shareFeedback}</span>
            <span style={{ fontFamily: F, fontSize: 12, color: theme.accent }}>{downloadFeedback}</span>
          </div>
          {badges.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {badges.slice(0, 6).map((b) => (
                <div
                  key={`${b.badge_key}-${b.earned_at}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 9px',
                    borderRadius: 999,
                    background: theme.accentLight,
                    border: `1px solid ${theme.accent}`,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{b.def.icon || '🏅'}</span>
                  <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: theme.text }}>
                    {formatBadgeTitle(b)}
                  </span>
                </div>
              ))}
              {badges.length > 6 && (
                <span style={{ fontFamily: F, fontSize: 11, color: theme.muted }}>+{badges.length - 6} more</span>
              )}
            </div>
          )}
        </div>

        {!hasAnyCards && (
          <Card style={{ margin: '8px 16px 16px', padding: '32px 24px', textAlign: 'center', background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
            <div style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: theme.text, marginBottom: 6 }}>No profile cards yet</div>
            <div style={{ fontFamily: F, fontSize: 13, color: theme.muted, lineHeight: 1.6 }}>
              This fan hasn&apos;t curated their public profile yet.
            </div>
          </Card>
        )}

        {hasAnyCards && cardsWithPrompts.map((card) => (
          <div
            key={card.id}
            style={{
              margin: '0 16px 16px',
              padding: '20px 20px',
              background: theme.cardBg,
              backdropFilter: 'blur(18px)',
              borderRadius: 20,
              border: `1px solid ${theme.cardBorder}`,
              boxShadow: `0 6px 22px ${theme.accent}26`,
              minHeight: 140,
            }}
          >
            <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, letterSpacing: 0.2, color: theme.muted, marginBottom: 4 }}>
              {card.prompt.prompt_text}
            </div>
            {renderCardAnswer(card)}
          </div>
        ))}
      </div>
  );

  if (embedded) {
    return (
      <div style={{ margin: '8px 16px 16px' }}>
        {inner}
      </div>
    );
  }

  return (
    <GradientBg>
      {inner}
    </GradientBg>
  );
}


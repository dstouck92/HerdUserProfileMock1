import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { supabase } from './lib/supabase';
import { GradientBg, Card, Sec, Stats, F, AvatarSprite } from './components/ui';

export default function PublicProfile({ username: usernameProp }) {
  const { username: usernameFromRoute } = useParams();
  const username = usernameProp ?? usernameFromRoute;
  const profileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [vinyl, setVinyl] = useState([]);
  const [merch, setMerch] = useState([]);
  const [streaming, setStreaming] = useState(null);
  const [shareFeedback, setShareFeedback] = useState('');
  const [downloadFeedback, setDownloadFeedback] = useState('');
  const [featuredYoutubeChannels, setFeaturedYoutubeChannels] = useState([]);

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
          .select('id, display_name, username, avatar_id')
          .eq('username', username)
          .single();
        if (profError || !prof) {
          throw new Error('Profile not found.');
        }
        if (cancelled) return;
        setProfile(prof);

        // 2) Load featured items
        const uid = prof.id;
        const [cRes, vRes, mRes, sRes, yRes] = await Promise.all([
          supabase.from('concerts').select('*').eq('user_id', uid).eq('is_featured', true).order('date', { ascending: false }),
          supabase.from('vinyl').select('*').eq('user_id', uid).eq('is_featured', true).order('created_at', { ascending: false }),
          supabase.from('merch').select('*').eq('user_id', uid).eq('is_featured', true).order('created_at', { ascending: false }),
          supabase.from('user_streaming_stats').select('*').eq('user_id', uid).single(),
          supabase.from('featured_youtube_channels_public').select('featured_youtube_channels').eq('user_id', uid).single(),
        ]);
        if (cancelled) return;
        if (cRes.data) setConcerts(cRes.data);
        if (vRes.data) setVinyl(vRes.data);
        if (mRes.data) setMerch(mRes.data);
        if (yRes.data?.featured_youtube_channels?.length) setFeaturedYoutubeChannels(yRes.data.featured_youtube_channels);
        if (sRes.data && sRes.data.user_id) {
          setStreaming({
            totalHours: sRes.data.total_hours ?? 0,
            totalRecords: sRes.data.total_records ?? 0,
            uniqueArtists: sRes.data.unique_artists ?? 0,
            uniqueTracks: sRes.data.unique_tracks ?? 0,
            featuredArtists: sRes.data.featured_artists ?? [],
          });
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
    return (
      <GradientBg>
        <div style={{ padding: '80px 24px', textAlign: 'center', fontFamily: F, fontSize: 15, color: '#0f766e' }}>
          Public profiles require Supabase to be configured.
        </div>
      </GradientBg>
    );
  }

  if (loading) {
    return (
      <GradientBg>
        <div style={{ padding: '80px 24px', textAlign: 'center', fontFamily: F, fontSize: 15, color: '#0f766e' }}>
          Loading profile…
        </div>
      </GradientBg>
    );
  }

  if (error || !profile) {
    return (
      <GradientBg>
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>Profile not found</div>
          <div style={{ fontFamily: F, fontSize: 14, color: 'rgba(55,48,107,0.6)' }}>{error || 'This profile does not exist.'}</div>
        </div>
      </GradientBg>
    );
  }

  const hasAnyFeatured = streaming?.featuredArtists?.length || concerts.length || vinyl.length || merch.length;

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

  return (
    <GradientBg>
      <div ref={profileRef} style={{ paddingBottom: 8 }}>
        <div style={{ padding: '24px 20px 12px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <AvatarSprite avatarId={profile.avatar_id ?? 7} size={72} />
          <div>
            <div style={{ fontFamily: F, fontSize: 22, fontWeight: 800, color: '#1e1b4b' }}>{profile.display_name}</div>
            <div style={{ fontFamily: F, fontSize: 13, color: 'rgba(55,48,107,0.6)', marginTop: 2 }}>@{profile.username}</div>
          </div>
        </div>
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleShareLink}
              style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(13,148,136,0.35)', background: 'rgba(255,255,255,0.8)', fontFamily: F, fontSize: 14, fontWeight: 600, color: '#0f766e', cursor: 'pointer' }}
            >
              Share
            </button>
            <button
              type="button"
              onClick={handleDownload}
              style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(13,148,136,0.35)', background: 'rgba(255,255,255,0.8)', fontFamily: F, fontSize: 14, fontWeight: 600, color: '#0f766e', cursor: 'pointer' }}
            >
              Download
            </button>
            <span style={{ fontFamily: F, fontSize: 12, color: '#059669' }}>{shareFeedback}</span>
            <span style={{ fontFamily: F, fontSize: 12, color: '#059669' }}>{downloadFeedback}</span>
          </div>
        </div>

      {!hasAnyFeatured && (
        <Card style={{ marginTop: 8, padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
          <div style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: '#1e1b4b', marginBottom: 6 }}>No featured items yet</div>
          <div style={{ fontFamily: F, fontSize: 13, color: 'rgba(55,48,107,0.55)', lineHeight: 1.6 }}>
            This fan hasn&apos;t curated their public profile yet.
          </div>
        </Card>
      )}

      {streaming && streaming.featuredArtists?.length > 0 && (
        <>
          <Stats
            stats={[
              { value: streaming.totalHours.toLocaleString(), label: 'Total Hours' },
              { value: streaming.uniqueArtists.toLocaleString(), label: 'Artists' },
              { value: streaming.uniqueTracks.toLocaleString(), label: 'Tracks' },
            ]}
          />
          <Sec icon="🎵">Featured Artists</Sec>
          <Card>
            {streaming.featuredArtists.map((a, i) => (
              <div key={i} style={{ padding: '10px 20px', borderBottom: i < streaming.featuredArtists.length - 1 ? '1px solid rgba(13,148,136,0.08)' : 'none' }}>
                <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: '#1e1b4b' }}>{a.name}</div>
                {a.hours != null && (
                  <div style={{ fontFamily: F, fontSize: 11, color: 'rgba(55,48,107,0.5)', marginTop: 2 }}>{a.hours} hours</div>
                )}
              </div>
            ))}
          </Card>
        </>
      )}

      {featuredYoutubeChannels.length > 0 && (
        <>
          <Sec icon="▶️">Featured YouTube Channels</Sec>
          <Card>
            {featuredYoutubeChannels.map((fc, i) => (
              <div
                key={(fc.channelId || fc.channelTitle) || i}
                style={{
                  padding: '12px 20px',
                  borderBottom: i < featuredYoutubeChannels.length - 1 ? '1px solid rgba(13,148,136,0.08)' : 'none',
                }}
              >
                <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: '#1e1b4b' }}>{fc.channelTitle || fc.channelId || '—'}</div>
              </div>
            ))}
          </Card>
        </>
      )}

      {concerts.length > 0 && (
        <>
          <Sec icon="🎫">Featured Concerts</Sec>
          <Card>
            {concerts.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  gap: 12,
                  borderBottom: i < concerts.length - 1 ? '1px solid rgba(13,148,136,0.08)' : 'none',
                }}
              >
                <span style={{ fontSize: 22 }}>🎫</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: '#1e1b4b' }}>
                    {c.artist}
                    {c.tour ? ` – ${c.tour}` : ''}
                  </div>
                  <div style={{ fontFamily: F, fontSize: 11, color: 'rgba(55,48,107,0.5)', marginTop: 2 }}>
                    {c.date} · {c.venue}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {vinyl.length > 0 && (
        <>
          <Sec icon="💿">Featured Vinyl</Sec>
          <Card>
            {vinyl.map((v, i) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  gap: 12,
                  borderBottom: i < vinyl.length - 1 ? '1px solid rgba(13,148,136,0.08)' : 'none',
                }}
              >
                <span style={{ fontSize: 22 }}>💿</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: '#1e1b4b' }}>{v.artist_name}</div>
                  <div style={{ fontFamily: F, fontSize: 11, color: 'rgba(55,48,107,0.5)', marginTop: 2 }}>
                    {v.album_name}
                    {v.is_limited_edition && <span style={{ color: '#0d9488', fontWeight: 600 }}> · Limited</span>}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {merch.length > 0 && (
        <>
          <Sec icon="👕">Featured Merch</Sec>
          <Card>
            {merch.map((m, i) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  gap: 12,
                  borderBottom: i < merch.length - 1 ? '1px solid rgba(13,148,136,0.08)' : 'none',
                }}
              >
                <span style={{ fontSize: 22 }}>👕</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: '#1e1b4b' }}>{m.artist_name}</div>
                  <div style={{ fontFamily: F, fontSize: 11, color: 'rgba(55,48,107,0.5)', marginTop: 2 }}>
                    {m.item_name} · {m.merch_type}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
      </div>
    </GradientBg>
  );
}


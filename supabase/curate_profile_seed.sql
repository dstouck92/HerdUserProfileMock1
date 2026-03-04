-- Seed curate prompt categories and prompts (from Curate Profile Questions PDF).
-- Run after curate_profile_schema.sql in Supabase SQL Editor.

-- Categories (match PDF section headers)
insert into public.curate_prompt_categories (slug, name, sort_order)
values
  ('music_taste', 'Music Taste', 1),
  ('provable_bragging_rights', 'Provable bragging rights', 2),
  ('concerts_live', 'Concerts / live music', 3),
  ('the_collection', 'The Collection', 4),
  ('listening_habits', 'Listening Habits', 5),
  ('personality_connection', 'Personality & Connection', 6),
  ('random_fun', 'Random & Fun', 7)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

-- Prompts: Music Taste
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'album_that_made_me', 'The album that made me who I am today is...', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["streaming"]}'::jsonb, 1
from public.curate_prompt_categories where slug = 'music_taste'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'music_taste_three_artists', 'My music taste can be described in three artists...', 200,
  '{"allowed_answer_types":["text","artist","data_ref","badges"],"data_sources":["streaming"],"supports_spotify_search":true,"supports_manual_artist_entry":true}'::jsonb, 2
from public.curate_prompt_categories where slug = 'music_taste'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'genre_defend', 'A genre I''ll defend with my whole chest...', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 3
from public.curate_prompt_categories where slug = 'music_taste'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'song_describe_personality', 'The song I''d play to describe my personality...', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["streaming"]}'::jsonb, 4
from public.curate_prompt_categories where slug = 'music_taste'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'guilty_pleasure_song', 'My most embarrassing guilty pleasure song is...', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["streaming"]}'::jsonb, 5
from public.curate_prompt_categories where slug = 'music_taste'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'decade_wish_grew_up', 'The decade of music I wish I grew up in...', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 6
from public.curate_prompt_categories where slug = 'music_taste'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;

-- Prompts: Provable bragging rights
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'bigger_fan_than_most', 'I think I''m a bigger fan of ____ than most people on the planet.', 200,
  '{"allowed_answer_types":["text","artist","data_ref","badges"],"data_sources":["streaming"],"supports_spotify_search":true,"supports_manual_artist_entry":true}'::jsonb, 10
from public.curate_prompt_categories where slug = 'provable_bragging_rights'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'listening_since_before_cool', 'I have been listening to ___ since before it was cool.', 200,
  '{"allowed_answer_types":["text","artist","data_ref","badges"],"data_sources":["streaming"],"supports_spotify_search":true,"supports_manual_artist_entry":true}'::jsonb, 11
from public.curate_prompt_categories where slug = 'provable_bragging_rights'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'top_genre_years', 'My top genre is ___ and it has been for years.', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 12
from public.curate_prompt_categories where slug = 'provable_bragging_rights'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'more_music_than_most', 'I''ve listened to more music this year than most people do in five.', 200,
  '{"allowed_answer_types":["data_ref"],"data_sources":["streaming"]}'::jsonb, 13
from public.curate_prompt_categories where slug = 'provable_bragging_rights'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'top_percent_artist_badge', 'My top 0.something% artist of the year was ___ and I earned that badge.', 200,
  '{"allowed_answer_types":["text","artist","badges"],"supports_spotify_search":true,"supports_manual_artist_entry":true}'::jsonb, 14
from public.curate_prompt_categories where slug = 'provable_bragging_rights'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;

-- Prompts: Concerts / live music
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'best_concert_ever', 'The best concert I''ve ever been to was...', 200,
  '{"allowed_answer_types":["text","images","data_ref","badges"],"data_sources":["concerts"]}'::jsonb, 20
from public.curate_prompt_categories where slug = 'concerts_live'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'seen_in_concert_times', 'I''ve seen ___ in concert ___ times and I''m not sorry.', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["concerts"],"text_template":"I''ve seen {0} in concert {1} times and I''m not sorry.","text_input_count":2,"text_input_labels":["Artist","Number of times"],"supports_spotify_search":true,"supports_manual_artist_entry":true}'::jsonb, 21
from public.curate_prompt_categories where slug = 'concerts_live'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'time_travel_concert', 'If I could time travel to one concert, I''m showing up to...', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 22
from public.curate_prompt_categories where slug = 'concerts_live'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'front_row_or_pit', 'Front row or back of the pit?', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 23
from public.curate_prompt_categories where slug = 'concerts_live'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'cannot_leave_earth_before_seeing', 'I cannot leave this earth before seeing ____ live.', 200,
  '{"allowed_answer_types":["text","artist","badges"],"supports_spotify_search":true,"supports_manual_artist_entry":true}'::jsonb, 24
from public.curate_prompt_categories where slug = 'concerts_live'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'concert_cried_at', 'A concert I''ve cried at is...', 200,
  '{"allowed_answer_types":["text","data_ref"],"data_sources":["concerts"]}'::jsonb, 25
from public.curate_prompt_categories where slug = 'concerts_live'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'unhinged_met_artist_story', 'My most unhinged "I met an artist" story...', 200,
  '{"allowed_answer_types":["text","images"]}'::jsonb, 26
from public.curate_prompt_categories where slug = 'concerts_live'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'opener_blew_me_away', 'The opener who blew me away more than the headliner...', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 27
from public.curate_prompt_categories where slug = 'concerts_live'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'festival_essentials', 'Festival essentials I never leave home without...', 200,
  '{"allowed_answer_types":["text","images"]}'::jsonb, 28
from public.curate_prompt_categories where slug = 'concerts_live'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'dream_festival_lineup_place', 'My dream festival has _____ on the lineup and it''s somewhere in _____. Make it happen.', 200,
  '{"allowed_answer_types":["text"],"text_template":"My dream festival has {0} on the lineup and it''s somewhere in {1}. Make it happen.","text_input_count":2,"text_input_labels":["Lineup (artists/festival name)","Place/location"]}'::jsonb, 29
from public.curate_prompt_categories where slug = 'concerts_live'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'best_festival_fit', 'My best festival fit ever was...', 200,
  '{"allowed_answer_types":["text","images"]}'::jsonb, 30
from public.curate_prompt_categories where slug = 'concerts_live'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'favorite_festival', 'My favorite festival I''ve ever been to was...', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 31
from public.curate_prompt_categories where slug = 'concerts_live'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;

-- Prompts: The Collection
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'most_prized_vinyl_merch', 'My most prized vinyl/CD/merch is...', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["vinyl","merch"]}'::jsonb, 40
from public.curate_prompt_categories where slug = 'the_collection'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'first_album_ever_bought', 'The first album I ever bought was...', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["vinyl","merch"]}'::jsonb, 41
from public.curate_prompt_categories where slug = 'the_collection'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'band_tee_wear_too_often', 'A band tee I wear way too often...', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["vinyl","merch"]}'::jsonb, 42
from public.curate_prompt_categories where slug = 'the_collection'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'best_piece_of_merch', 'The best piece of merch I''ve ever bought was...', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["vinyl","merch"]}'::jsonb, 43
from public.curate_prompt_categories where slug = 'the_collection'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;

-- Prompts: Listening Habits
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'listen_music_most_when', 'I listen to music most when I''m...', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 50
from public.curate_prompt_categories where slug = 'listening_habits'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'shuffle_or_full_album', 'Shuffle or full album start to finish?', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 51
from public.curate_prompt_categories where slug = 'listening_habits'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'song_listened_100_plus', 'A song I''ve listened to 100+ times...', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["streaming"]}'::jsonb, 52
from public.curate_prompt_categories where slug = 'listening_habits'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'last_song_on_repeat', 'The last song I had on repeat for an embarrassing amount of time...', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["streaming"]}'::jsonb, 53
from public.curate_prompt_categories where slug = 'listening_habits'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'aux_cord_privileges', 'Aux cord privileges: earned or given freely?', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 54
from public.curate_prompt_categories where slug = 'listening_habits'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;

-- Prompts: Personality & Connection
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'soulmates_top_artist', 'We''re probably soulmates if your top artist is...', 200,
  '{"allowed_answer_types":["text","artist"],"supports_spotify_search":true,"supports_manual_artist_entry":true}'::jsonb, 60
from public.curate_prompt_categories where slug = 'personality_connection'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'lyric_live_by', 'A lyric I live by...', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 61
from public.curate_prompt_categories where slug = 'personality_connection'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'song_first_date_vibe', 'The song I''d play on a first date to set the vibe...', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 62
from public.curate_prompt_categories where slug = 'personality_connection'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'music_snob_or_casual', 'Music snob, casual listener, or somewhere in between?', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 63
from public.curate_prompt_categories where slug = 'personality_connection'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'trust_know_every_word', 'I will immediately trust you if you know every word to...', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 64
from public.curate_prompt_categories where slug = 'personality_connection'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'artist_breakup_not_recovered', 'The artist breakup that I still haven''t recovered from is...', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 65
from public.curate_prompt_categories where slug = 'personality_connection'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'different_person_when_comes_on', 'I become a different person when ___ comes on.', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["streaming"]}'::jsonb, 66
from public.curate_prompt_categories where slug = 'personality_connection'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;

-- Prompts: Random & Fun
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'walk_up_song', 'My walk up song would be...', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["streaming"]}'::jsonb, 70
from public.curate_prompt_categories where slug = 'random_fun'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'karaoke_go_to', 'My karaoke go-to song that always lands...', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["streaming"]}'::jsonb, 71
from public.curate_prompt_categories where slug = 'random_fun'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'main_character_song', 'My "main character" song...', 200,
  '{"allowed_answer_types":["text","data_ref","badges"],"data_sources":["streaming"]}'::jsonb, 72
from public.curate_prompt_categories where slug = 'random_fun'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'collaboration_give_anything', 'A collaboration I''d give anything to hear...', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 73
from public.curate_prompt_categories where slug = 'random_fun'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'music_video_watch_loop', 'The music video I could watch on loop...', 200,
  '{"allowed_answer_types":["text","data_ref"],"data_sources":["youtube"]}'::jsonb, 74
from public.curate_prompt_categories where slug = 'random_fun'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'week_as_album_title', 'I had to describe my week as an album title...', 200,
  '{"allowed_answer_types":["text"]}'::jsonb, 75
from public.curate_prompt_categories where slug = 'random_fun'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;
insert into public.curate_prompts (category_id, slug, prompt_text, max_characters, answer_config, sort_order)
select id, 'song_belting_in_shower', 'The song I''m belting out in the shower is...', 200,
  '{"allowed_answer_types":["text","artist","data_ref"],"data_sources":["streaming"],"supports_spotify_search":true,"supports_manual_artist_entry":true}'::jsonb, 76
from public.curate_prompt_categories where slug = 'random_fun'
on conflict (slug) do update set category_id = excluded.category_id, prompt_text = excluded.prompt_text, max_characters = excluded.max_characters, answer_config = excluded.answer_config, sort_order = excluded.sort_order;

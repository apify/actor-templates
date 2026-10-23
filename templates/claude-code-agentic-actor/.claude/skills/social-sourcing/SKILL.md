---
name: social-sourcing
description: How to find posts and profiles on Instagram, TikTok and YouTube for a topic with Apify Actors, with input shapes that are known to work. Use before calling any social media Actor.
---

# Sourcing social posts and profiles

Inputs below were tested in the chat this Actor was made from. Use them as they are and change only
the values in `<...>`. Keep `resultsLimit`-style fields small: every item costs money. Run each one
as the `apify-actor-runtime` skill describes, saving items to `data/raw/<platform>.json`
(`instagram.json`, `instagram-profiles.json`, `tiktok.json`, `youtube.json`).

## Instagram

Posts for a hashtag (no spaces, no `#`):

```json
{ "actor": "apify/instagram-hashtag-scraper",
  "input": { "hashtags": ["<topichashtag>"], "resultsType": "posts", "resultsLimit": 50 } }
```

Profiles for handles collected from the posts (`ownerUsername`):

```json
{ "actor": "apify/instagram-profile-scraper",
  "input": { "usernames": ["<handle1>", "<handle2>"] } }
```

Fields used later: `ownerUsername`, `likesCount`, `commentsCount`, `timestamp`; on profiles
`followersCount`, `postsCount`.

## TikTok

One run returns videos with author stats, so no profile step is needed:

```json
{ "actor": "clockworks/tiktok-scraper",
  "input": { "hashtags": ["<topichashtag>"], "resultsPerPage": 50, "shouldDownloadVideos": false } }
```

Fields used later: `authorMeta.name`, `authorMeta.fans`, `diggCount`, `commentCount`, `playCount`.

## YouTube

```json
{ "actor": "streamers/youtube-scraper",
  "input": { "searchQueries": ["<topic>"], "maxResults": 30 } }
```

Fields used later: `channelName`, `numberOfSubscribers`, `viewCount`, `likes`.

## Pitfalls seen in the original chat

- Instagram hashtag search with spaces returns 0 items; join words (`vegancooking`).
- TikTok `searchQueries` returned mostly unrelated trending videos; `hashtags` worked.

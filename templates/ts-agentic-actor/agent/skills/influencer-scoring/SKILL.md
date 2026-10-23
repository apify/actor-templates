---
name: influencer-scoring
description: Scores influencer candidates from raw social media items with a fixed formula. Use after sourcing, to rank candidates and to re-rank after excluding handles.
---

# Scoring influencers

Run:

```bash
python3 agent/skills/influencer-scoring/scripts/score.py data/raw data/scored.json --exclude data/exclude.txt
```

The script normalises the platform-specific fields, groups posts by author and writes one object
per author, sorted by `score` (highest first):

`platform, handle, profileUrl, followers, postsOnTopic, avgEngagementRate, score`

Score = 0.5 × log10(followers) / 7 + 0.3 × min(postsOnTopic / 5, 1) + 0.2 × min(avgEngagementRate / 0.06, 1),
so it is between 0 and 1. It favours accounts that post on the topic repeatedly over one viral post.

Authors with fewer than 1,000 followers are dropped. `--exclude` takes a file with one handle per
line; missing file means nothing is excluded.

Add `whyRelevant` yourself after scoring; the script leaves it empty.

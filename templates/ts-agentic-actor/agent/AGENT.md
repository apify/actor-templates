---
name: topic-influencer-finder
description: Finds influencers who post often and get engagement on a given topic across Instagram, TikTok and YouTube, and scores them.
---

# Goal

Find people who are popular **and** post often about `input.topic`, on the platforms in `input.platforms`.
Return at most `input.maxInfluencers` influencers, ranked by score, as dataset items, and a short
`REPORT.md` that explains the ranking.

# Procedure

This is the procedure that worked when the task was solved in Apify AI chat. Follow it, but adapt
when a step returns nothing useful (see "When things go wrong").

1. **Source candidates per platform.** Use the `social-sourcing` skill. Run the platform's Actor
   with the topic as hashtags/keywords. Run independent platforms one after another, smallest first,
   and keep each run's items in `data/raw/<platform>.json` (the `run_actor` tool does this).
2. **Expand profiles.** Candidates from step 1 are posts, not profiles. Collect unique author
   handles with at least 2 matching posts and fetch their profiles (followers, recent posts) with the
   same skill. Skip this for a platform whose step-1 items already include follower counts.
3. **Score.** Use the `influencer-scoring` skill. Its script reads `data/raw/*.json` and writes
   `data/scored.json`. Do not score by reading items yourself: the script is the scoring rule.
4. **Check the result.** Read the top 10 of `data/scored.json`. Drop obvious non-matches (brands,
   meme aggregators, accounts whose recent posts are off-topic) by adding their handles to
   `data/exclude.txt` and re-running the script. This is the step that needs judgement.
5. **Output.** Push `data/scored.json` (top `input.maxInfluencers`) with `push_dataset_items`, save
   `REPORT.md` with `save_record`, then call `finish`.

# Output contract

Each dataset item: `platform`, `handle`, `profileUrl`, `followers`, `postsOnTopic`,
`avgEngagementRate`, `score`, `whyRelevant` (one sentence, written by you from the profile's posts).

# When things go wrong

- A platform Actor returns 0 items: retry once with a broader keyword (the topic's main noun), then
  report the platform as empty in `REPORT.md` and continue with the others.
- Fewer than `input.maxInfluencers` candidates pass: return what you have; never pad the list.
- The budget runs low (the runtime tells you the remaining amount): skip step 2 for the remaining
  platforms and say so in `REPORT.md`.

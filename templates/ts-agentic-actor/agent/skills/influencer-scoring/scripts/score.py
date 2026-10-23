"""Score influencer candidates from raw Actor items. Usage: score.py <raw_dir> <out.json> [--exclude file]"""

import json
import math
import sys
from collections import defaultdict
from pathlib import Path

MIN_FOLLOWERS = 1000


def normalise(platform, item):
    """Map one raw item to (handle, followers, engagement, profile_url), or None."""
    if platform == 'instagram':
        handle = item.get('ownerUsername') or item.get('username')
        followers = item.get('followersCount') or 0
        engagement = (item.get('likesCount') or 0) + (item.get('commentsCount') or 0)
        return handle, followers, engagement, f'https://www.instagram.com/{handle}/'
    if platform == 'tiktok':
        author = item.get('authorMeta') or {}
        handle = author.get('name')
        engagement = (item.get('diggCount') or 0) + (item.get('commentCount') or 0)
        return handle, author.get('fans') or 0, engagement, f'https://www.tiktok.com/@{handle}'
    if platform == 'youtube':
        handle = item.get('channelName')
        engagement = item.get('likes') or 0
        return handle, item.get('numberOfSubscribers') or 0, engagement, item.get('channelUrl')
    return None


def score(followers, posts, engagement_rate):
    reach = min(math.log10(max(followers, 1)) / 7, 1)
    return round(0.5 * reach + 0.3 * min(posts / 5, 1) + 0.2 * min(engagement_rate / 0.06, 1), 4)


def main():
    raw_dir, out_path = Path(sys.argv[1]), Path(sys.argv[2])
    exclude = set()
    if '--exclude' in sys.argv:
        exclude_path = Path(sys.argv[sys.argv.index('--exclude') + 1])
        if exclude_path.exists():
            exclude = {line.strip().lower() for line in exclude_path.read_text().splitlines() if line.strip()}

    authors = defaultdict(lambda: {'followers': 0, 'posts': 0, 'engagement': 0, 'profileUrl': None})
    # Profiles files (e.g. instagram-profiles.json) carry followers; post files carry engagement.
    for path in sorted(raw_dir.glob('*.json')):
        platform = path.stem.split('-')[0]
        for item in json.loads(path.read_text()):
            row = normalise(platform, item)
            if not row or not row[0] or row[0].lower() in exclude:
                continue
            handle, followers, engagement, url = row
            author = authors[(platform, handle)]
            author['followers'] = max(author['followers'], followers)
            author['profileUrl'] = author['profileUrl'] or url
            if engagement:
                author['posts'] += 1
                author['engagement'] += engagement

    results = []
    for (platform, handle), a in authors.items():
        if a['followers'] < MIN_FOLLOWERS or a['posts'] == 0:
            continue
        rate = a['engagement'] / a['posts'] / a['followers']
        results.append({
            'platform': platform,
            'handle': handle,
            'profileUrl': a['profileUrl'],
            'followers': a['followers'],
            'postsOnTopic': a['posts'],
            'avgEngagementRate': round(rate, 4),
            'score': score(a['followers'], a['posts'], rate),
            'whyRelevant': '',
        })
    results.sort(key=lambda r: r['score'], reverse=True)
    out_path.write_text(json.dumps(results, indent=2))
    print(f'Scored {len(results)} authors, wrote {out_path}')


if __name__ == '__main__':
    main()

#!/bin/sh
# PreToolUse hook: a Bash command may run only the Actors in ALLOWED and must cap their cost.
# Exit code 2 blocks the call and shows stderr to the model.
ALLOWED='apify~instagram-hashtag-scraper apify~instagram-profile-scraper clockworks~tiktok-scraper streamers~youtube-scraper'

command=$(jq -r '.tool_input.command // ""')
case "$command" in *api.apify.com/v2/acts/*) ;; *) exit 0 ;; esac

for actor in $(printf '%s' "$command" | grep -o 'api.apify.com/v2/acts/[^/?" ]*' | sed 's#.*/acts/##'); do
    case " $ALLOWED " in
        *" $actor "*) ;;
        *) echo "Actor $actor is not allowed. Allowed: $ALLOWED" >&2; exit 2 ;;
    esac
done
case "$command" in
    *maxTotalChargeUsd=*) exit 0 ;;
    *) echo 'Add maxTotalChargeUsd to the Actor run URL.' >&2; exit 2 ;;
esac

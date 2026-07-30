#!/bin/bash

# Optional shard argument ("2/4"): build only a round-robin slice of the
# Dockerfiles, same n/m convention as TEST_SHARD in test/templates.test.js.
# No argument = build everything.
shard="${1:-1/1}"
shard_index="${shard%%/*}"
shard_total="${shard##*/}"

# `find` order is filesystem-dependent — sort so all shards agree on indexing.
mapfile -t all_dockerfiles < <(find templates -name "Dockerfile" -type f | sort)

dockerfiles=()
for i in "${!all_dockerfiles[@]}"; do
    if (( i % shard_total == shard_index - 1 )); then
        dockerfiles+=("${all_dockerfiles[$i]}")
    fi
done

if [ ${#dockerfiles[@]} -eq 0 ]; then
    echo "No Dockerfiles found in templates directory (shard $shard)"
    exit 1
fi

echo "Building ${#dockerfiles[@]} of ${#all_dockerfiles[@]} Dockerfiles (shard $shard)"

successful_builds=0
failed_builds=0

for dockerfile in "${dockerfiles[@]}"; do
    echo "Testing Dockerfile: $dockerfile"
    echo "--------------------------------"

    template_dir=$(dirname "$dockerfile")

    cd "$template_dir" || {
        echo "Failed to cd to $template_dir"
        exit 1
    }

    # Build the image with a unique tag
    image_tag="test-$(basename "$template_dir")-$(date +%s)"
    if docker build -f "./Dockerfile" -t "$image_tag" . --progress=plain; then
        echo "✓ Successfully built $dockerfile"
        (( successful_builds = successful_builds + 1 ))

        # Clean up the specific image immediately after building
        docker rmi "$image_tag" >/dev/null 2>&1
    else
        echo "✗ Failed to build $dockerfile"
        (( failed_builds = failed_builds + 1 ))
    fi

    # Keep base images and the BuildKit cache between builds — most templates
    # share the same apify/actor-* base layers. Reclaim disk only under
    # real pressure, and then reclaim everything (bases get re-pulled).
    available_gb=$(df --output=avail -BG / | tail -1 | tr -dc '0-9')
    if (( available_gb < 15 )); then
        echo "Only ${available_gb}GB free, pruning all Docker caches..."
        docker system prune -af >/dev/null 2>&1
        df -h /
    fi

    cd - >/dev/null || {
        echo "Failed to return to root directory"
        exit 1
    }

    echo "--------------------------------"
done

echo "Build Summary:"
echo "Successful builds: $successful_builds"
echo "Failed builds: $failed_builds"

if [ $failed_builds -gt 0 ]; then
    echo "Some Dockerfile builds failed"
    exit 1
else
    echo "All Dockerfiles built successfully!"
    exit 0
fi

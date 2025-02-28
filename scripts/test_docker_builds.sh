#!/bin/bash

# Find all Dockerfiles in the templates directory
mapfile -t dockerfiles < <(find templates -name "Dockerfile" -type f)

if [ ${#dockerfiles[@]} -eq 0 ]; then
    echo "No Dockerfiles found in templates directory"
    exit 1
fi

successful_builds=0
failed_builds=0

for dockerfile in "${dockerfiles[@]}"; do
    echo "Testing Dockerfile: $dockerfile"
    echo "--------------------------------"

    build_dir=$(dirname "$dockerfile")
    template_dir=$(dirname "$build_dir")

    cd "$template_dir" || {
        echo "Failed to cd to $template_dir"
        exit 1
    }

    # Clean up before building to ensure maximum space
    echo "Cleaning up Docker images before build..."
    docker image prune -f >/dev/null 2>&1

    # Build the image with a unique tag
    image_tag="test-$(basename "$template_dir")-$(date +%s)"
    if docker build -f ".actor/Dockerfile" -t "$image_tag" . --progress=plain; then
        echo "✓ Successfully built $dockerfile"
        (( successful_builds = successful_builds + 1 ))

        # Clean up the specific image immediately after building
        docker rmi "$image_tag" >/dev/null 2>&1
    else
        echo "✗ Failed to build $dockerfile"
        (( failed_builds = failed_builds + 1 ))
    fi

    # Clean up dangling images and unused layers after build
    echo "Cleaning up Docker images after build..."
    docker image prune -f >/dev/null 2>&1

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

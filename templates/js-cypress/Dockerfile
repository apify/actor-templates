FROM cypress/browsers:node-24.14.0-chrome-145.0.7632.116-1-ff-148.0-edge-145.0.3800.70-1
# cypress image entrypoint runs the tests right away
# we want to run our own CMD
ENTRYPOINT [""]

COPY package*.json ./

# Install NPM packages, skip optional and development dependencies to
# keep the image small. Avoid logging too much and print the dependency
# tree for debugging
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && rm -r ~/.npm

# Next, copy the remaining files and directories with the source code.
# Since we do this after NPM install, quick build will be really fast
# for most source file changes.
COPY . ./

# Run the image.
CMD ["node", "src/main.js"]

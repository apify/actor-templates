"""Module defines the main entry point for the Apify Actor.

Feel free to modify this file to suit your specific needs.

To build Apify Actors, utilize the Apify SDK toolkit, read more at the official documentation:
https://docs.apify.com/sdk/python
"""

from __future__ import annotations

from http.server import HTTPServer, SimpleHTTPRequestHandler

from apify import Actor


class GetHandler(SimpleHTTPRequestHandler):
    """A simple GET HTTP handler that will respond with a message."""

    def do_GET(self) -> None:  # noqa: N802
        """Handle GET request and respond with a message."""
        # Handle Apify standby readiness probe
        # https://docs.apify.com/platform/actors/development/programming-interface/standby#readiness-probe
        if 'x-apify-container-server-readiness-probe' in self.headers:
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'ok')
            return

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'Hello from Actor Standby!')


async def main() -> None:
    """Define a main entry point for the Apify Actor.

    This coroutine is executed using `asyncio.run()`, so it must remain an asynchronous function for proper execution.
    Asynchronous execution is required for communication with Apify platform, and it also enhances performance in
    the field of web scraping significantly.
    """
    async with Actor:
        # A simple HTTP server listening on Actor standby port.
        with HTTPServer(('', Actor.config.standby_port), GetHandler) as http_server:
            http_server.serve_forever()

"""
Server implementation for ArXiv MCP Server.
This module implements the stdioToSse functionality that bridges between HTTP clients
and the MCP server process using Server-Sent Events (SSE).
"""

import asyncio
import json
import logging
from typing import Dict, Optional
from dataclasses import dataclass
from subprocess import Popen, PIPE

from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel

from .billing import charge_message_request, MessageRequest as BillingMessageRequest

app = FastAPI()

@dataclass
class Session:
    """Represents an active SSE session."""
    transport: EventSourceResponse
    session_id: str

class MessageRequest(BaseModel):
    """Model for incoming message requests."""
    method: str
    # Add other fields as needed

class StdioToSseArgs:
    """Arguments for stdioToSse function."""
    def __init__(
        self,
        stdio_cmd: str,
        port: int,
        base_url: str = '',
        sse_path: str = '/sse',
        message_path: str = '/message',
        logger: logging.Logger = None
    ):
        self.stdio_cmd = stdio_cmd
        self.port = port
        self.base_url = base_url
        self.sse_path = sse_path
        self.message_path = message_path
        self.logger = logger or logging.getLogger('apify')

class StdioToSse:
    """Main class implementing the stdioToSse functionality."""

    def __init__(self, args: StdioToSseArgs):
        self.args = args
        self.app = FastAPI()
        self.sessions: Dict[str, Session] = {}
        self.child_process: Optional[Popen] = None
        self._setup_routes()

    def _setup_routes(self):
        """Set up FastAPI routes for SSE and message endpoints."""

        @self.app.get('/')
        async def root():
            """Root endpoint that provides information about available endpoints."""
            return {
                'message': 'MCP Server is running in standby mode',
                'endpoints': {
                    'sse': {
                        'path': self.args.sse_path,
                        'method': 'GET',
                        'description': 'Server-Sent Events endpoint for streaming MCP server responses',
                        'query_params': None,
                        'example': f'curl -N http://localhost:{self.args.port}{self.args.sse_path}'
                    },
                    'message': {
                        'path': self.args.message_path,
                        'method': 'POST',
                        'description': 'Send messages to the MCP server',
                        'query_params': {
                            'sessionId': 'Required. ID of the active SSE session'
                        },
                        'example': f'curl -X POST "http://localhost:{self.args.port}{self.args.message_path}?sessionId=123" -H "Content-Type: application/json" -d \'{{"method": "tools/search"}}\''
                    }
                },
                'documentation': 'https://modelcontextprotocol.io/specification/2025-03-26/server'
            }

        @self.app.get(self.args.sse_path)
        async def sse_endpoint(request: Request):
            """Handle SSE connections."""
            client_ip = request.client.host if request.client else 'unknown'
            self.args.logger.info(f"New SSE connection from {client_ip}")

            async def event_generator():
                # Create a new session
                session_id = str(len(self.sessions))
                transport = EventSourceResponse(event_generator())
                session = Session(transport=transport, session_id=session_id)
                self.sessions[session_id] = session

                try:
                    # Keep the connection alive
                    while True:
                        if await request.is_disconnected():
                            break
                        await asyncio.sleep(1)
                        yield {"event": "ping", "data": ""}
                finally:
                    self.args.logger.info(f"SSE connection closed (session {session_id})")
                    if session_id in self.sessions:
                        del self.sessions[session_id]

            return EventSourceResponse(event_generator())

        @self.app.post(self.args.message_path)
        async def message_endpoint(request: Request, message: MessageRequest):
            """Handle incoming messages."""
            session_id = request.query_params.get('sessionId')
            if not session_id:
                raise HTTPException(status_code=400, detail="Missing sessionId parameter")

            if session_id not in self.sessions:
                raise HTTPException(
                    status_code=503,
                    detail=f"No active SSE connection for session {session_id}"
                )

            # Charge for the request
            await charge_message_request(BillingMessageRequest(method=message.method))

            # Forward message to MCP server
            try:
                message_str = json.dumps(message.dict()) + "\n"
                self.child_process.stdin.write(message_str)
                self.child_process.stdin.flush()
                self.args.logger.info(f"Message sent to MCP server (session {session_id})")
                return JSONResponse({"status": "ok"})
            except Exception as e:
                self.args.logger.error(f"Error sending message: {e}")
                raise HTTPException(status_code=500, detail="Failed to send message")

    async def start(self):
        """Start the MCP server process and begin handling requests."""
        self.args.logger.info(f"Starting MCP server: {self.args.stdio_cmd}")
        self.args.logger.info(f"  - port: {self.args.port}")
        self.args.logger.info(f"  - sse_path: {self.args.sse_path}")
        self.args.logger.info(f"  - message_path: {self.args.message_path}")

        # Start the MCP server process
        self.child_process = Popen(
            self.args.stdio_cmd,
            shell=True,
            stdin=PIPE,
            stdout=PIPE,
            stderr=PIPE,
            text=True,
            bufsize=1
        )

        # Start background task to read from MCP server
        asyncio.create_task(self._read_mcp_output())
        asyncio.create_task(self._read_mcp_errors())

        # Monitor child process
        asyncio.create_task(self._monitor_child_process())

    async def _read_mcp_output(self):
        """Read and process output from the MCP server."""
        buffer = ""
        while True:
            if self.child_process.stdout is None:
                break

            line = self.child_process.stdout.readline()
            if not line:
                break

            buffer += line
            while "\n" in buffer:
                line, buffer = buffer.split("\n", 1)
                line = line.strip()
                if not line:
                    continue

                try:
                    message = json.loads(line)
                    self.args.logger.info(f"MCP server output: {json.dumps(message)}")

                    # Broadcast to all sessions
                    for session_id, session in list(self.sessions.items()):
                        try:
                            # Send message to client
                            # Note: This is a simplified version. In practice, you'd need
                            # to implement proper message queuing and delivery
                            pass
                        except Exception as e:
                            self.args.logger.error(f"Error sending to session {session_id}: {e}")
                            del self.sessions[session_id]
                except json.JSONDecodeError:
                    self.args.logger.error(f"Non-JSON output from MCP server: {line}")

    async def _read_mcp_errors(self):
        """Read and log errors from the MCP server."""
        while True:
            if self.child_process.stderr is None:
                break

            line = self.child_process.stderr.readline()
            if not line:
                break

            self.args.logger.error(f"MCP server error: {line.strip()}")

    async def _monitor_child_process(self):
        """Monitor the MCP server process and handle its exit."""
        while True:
            if self.child_process.poll() is not None:
                code = self.child_process.returncode
                self.args.logger.error(f"MCP server process exited with code {code}")
                # Clean up sessions
                self.sessions.clear()
                break
            await asyncio.sleep(1)

    async def stop(self):
        """Stop the MCP server process and clean up."""
        if self.child_process:
            self.child_process.terminate()
            try:
                self.child_process.wait(timeout=5)
            except TimeoutError:
                self.child_process.kill()
            self.child_process = None
        self.sessions.clear()

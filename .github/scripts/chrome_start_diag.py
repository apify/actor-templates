"""Temporary diagnostic: time Chrome startup on the CI runner with the browser-use launch flags."""

from __future__ import annotations

import asyncio
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

import websockets
from browser_use.browser.profile import BrowserProfile

RUNS = int(os.environ.get('DIAG_RUNS', '5'))
LIMIT_SECS = 45.0


def base_args(user_data_dir: str) -> list[str]:
    profile = BrowserProfile(headless=True, chromium_sandbox=False, enable_default_extensions=False)
    profile.user_data_dir = user_data_dir
    return profile.get_args()


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


async def wait_port(port: int, deadline: float) -> str:
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/version', timeout=1) as resp:
                return json.load(resp)['webSocketDebuggerUrl']
        except Exception:
            await asyncio.sleep(0.1)
    raise TimeoutError('CDP port did not open')


async def wait_page(ws_url: str, deadline: float) -> tuple[int, float]:
    async with websockets.connect(ws_url, max_size=None) as ws:
        msg_id = 0

        async def call(method: str, params: dict | None = None, session_id: str | None = None) -> dict:
            nonlocal msg_id
            msg_id += 1
            payload = {'id': msg_id, 'method': method, 'params': params or {}}
            if session_id:
                payload['sessionId'] = session_id
            await ws.send(json.dumps(payload))
            while True:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise TimeoutError(f'{method} timed out')
                data = json.loads(await asyncio.wait_for(ws.recv(), timeout=remaining))
                if data.get('id') == msg_id:
                    if 'error' in data:
                        raise RuntimeError(f'{method}: {data["error"]}')
                    return data['result']

        targets = (await call('Target.getTargets'))['targetInfos']
        pages = [t for t in targets if t['type'] == 'page']
        start = time.monotonic()
        if pages:
            target_id = pages[0]['targetId']
        else:
            target_id = (await call('Target.createTarget', {'url': 'about:blank'}))['targetId']
        session_id = (await call('Target.attachToTarget', {'targetId': target_id, 'flatten': True}))['sessionId']
        await call('Page.enable', session_id=session_id)
        await call('Runtime.evaluate', {'expression': '1 + 1'}, session_id=session_id)
        return len(targets), time.monotonic() - start


async def launch(name: str, cmd_prefix: list[str], executable: str, drop: set[str], env: dict[str, str]) -> None:
    user_data_dir = tempfile.mkdtemp(prefix='diag-chrome-')
    port = free_port()
    args = [a for a in base_args(user_data_dir) if a not in drop]
    cmd = [*cmd_prefix, executable, *args, f'--remote-debugging-port={port}', 'about:blank']
    stderr_path = Path(user_data_dir) / 'stderr.log'
    with stderr_path.open('wb') as stderr_file:
        start = time.monotonic()
        deadline = start + LIMIT_SECS
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=stderr_file, env=env, start_new_session=True)
        result = ''
        try:
            ws_url = await wait_port(port, deadline)
            t_port = time.monotonic() - start
            n_targets, t_page = await wait_page(ws_url, deadline)
            result = f'OK   port={t_port:5.1f}s page={t_page:5.1f}s targets={n_targets}'
        except Exception as exc:
            result = f'FAIL after {time.monotonic() - start:5.1f}s: {type(exc).__name__}: {exc}'
        finally:
            try:
                os.killpg(proc.pid, 9)
            except ProcessLookupError:
                pass
            proc.wait()
    print(f'[{name}] {result}', flush=True)
    if result.startswith('FAIL'):
        tail = stderr_path.read_text(errors='replace').splitlines()[-25:]
        print('\n'.join(f'    | {line}' for line in tail), flush=True)
    shutil.rmtree(user_data_dir, ignore_errors=True)


async def main() -> None:
    chrome = os.environ.get('APIFY_CHROME_EXECUTABLE_PATH') or shutil.which('google-chrome') or 'google-chrome'
    print(f'chrome={chrome}', flush=True)
    print(subprocess.run([chrome, '--version'], capture_output=True, text=True).stdout.strip(), flush=True)
    print('args:', ' '.join(base_args('/tmp/x')), flush=True)

    env = dict(os.environ)
    no_dbus_env = {k: v for k, v in env.items() if not k.startswith('DBUS_')}
    no_dbus_env['DBUS_SESSION_BUS_ADDRESS'] = 'disabled:'
    variants: list[tuple[str, list[str], str, set[str], dict[str, str]]] = [
        ('baseline', [], chrome, set(), env),
        ('no-zygote-dropped', [], chrome, {'--no-zygote'}, env),
        ('dbus-disabled', [], chrome, set(), no_dbus_env),
    ]
    if shutil.which('dbus-run-session'):
        variants.append(('dbus-run-session', ['dbus-run-session', '--'], chrome, set(), env))
    pw_chrome = os.environ.get('DIAG_PLAYWRIGHT_CHROMIUM')
    if pw_chrome:
        variants.append(('playwright-chromium', [], pw_chrome, set(), env))
    variants.append(('baseline-again', [], chrome, set(), env))

    for name, prefix, executable, drop, variant_env in variants:
        for _ in range(RUNS):
            await launch(name, prefix, executable, drop, variant_env)


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))

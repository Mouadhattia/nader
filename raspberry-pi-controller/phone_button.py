"""Raspberry Pi phone-button controller for the Audio Guest Book.

Wire a normally-open push button (or a classic phone's hook switch) between
a GPIO pin and GND. Each press toggles recording on the guest kiosk:

  press 1 -> emits "start_recording"
  press 2 -> emits "stop_recording"
  press 3 -> emits "start_recording"
  ...

Events are sent to the Audio Guest Book backend over Socket.IO, which
relays them to whichever guest kiosk browser tab(s) are connected.
"""

import os
import time

from dotenv import load_dotenv
import socketio

load_dotenv()

SERVER_URL = os.getenv("SERVER_URL", "http://localhost:5000")
AUTH_TOKEN = os.getenv("PI_SHARED_TOKEN", "")
BUTTON_PIN = int(os.getenv("BUTTON_GPIO_PIN", "17"))
BOUNCE_MS = int(os.getenv("BUTTON_BOUNCE_MS", "300"))
PULL_UP = os.getenv("BUTTON_PULL_UP", "true").strip().lower() != "false"
SIMULATE = os.getenv("SIMULATE", "false").strip().lower() == "true"

sio = socketio.Client(reconnection=True, reconnection_delay=2, reconnection_delay_max=30)

is_recording = False


@sio.event
def connect():
    print(f"[socket] connected to {SERVER_URL}")


@sio.event
def connect_error(data):
    print(f"[socket] connection error: {data}")


@sio.event
def disconnect():
    print("[socket] disconnected, socketio will retry in the background")


def on_button_press():
    global is_recording
    is_recording = not is_recording
    event = "start_recording" if is_recording else "stop_recording"
    print(f"[button] pressed -> emitting '{event}'")
    try:
        sio.emit(event)
    except Exception as exc:
        print(f"[button] failed to emit '{event}': {exc}")


def connect_with_retry() -> None:
    auth = {"token": AUTH_TOKEN} if AUTH_TOKEN else {}
    delay = 2
    while True:
        try:
            sio.connect(SERVER_URL, auth=auth)
            return
        except Exception as exc:
            print(f"[socket] connect failed ({exc}), retrying in {delay}s")
            time.sleep(delay)
            delay = min(delay * 2, 30)


def run_gpio() -> None:
    from gpiozero import Button

    button = Button(BUTTON_PIN, pull_up=PULL_UP, bounce_time=BOUNCE_MS / 1000)
    button.when_pressed = on_button_press
    print(
        f"[gpio] listening on GPIO{BUTTON_PIN} "
        f"(pull_up={PULL_UP}, bounce={BOUNCE_MS}ms)"
    )

    while True:
        time.sleep(1)


def run_simulated() -> None:
    print("[simulate] SIMULATE=true -> press Enter to simulate a button press, Ctrl+C to quit")
    while True:
        input()
        on_button_press()


def main() -> None:
    connect_with_retry()

    try:
        if SIMULATE:
            run_simulated()
        else:
            run_gpio()
    except KeyboardInterrupt:
        pass
    finally:
        sio.disconnect()


if __name__ == "__main__":
    main()

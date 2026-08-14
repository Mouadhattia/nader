# Raspberry Pi Phone Button Controller

Standalone Python service for a Raspberry Pi. Wires a classic phone's
hook switch (or any push button) to a GPIO pin. Each press toggles
recording on the Audio Guest Book guest kiosk over Socket.IO:

- 1st press -> tells the kiosk to **start** recording
- 2nd press -> tells the kiosk to **stop** recording

This is a separate project from the main Audio Guest Book app (different
language/runtime), but it talks to that app's backend over the network.

## Wiring

You need a simple momentary push button (2-leg tactile switch, "normally
open") — or eventually the phone's own hook switch. It just needs to
connect two wires together when pressed and disconnect them when released.

Connect the button's two legs across:

| Signal        | Physical pin | Notes                          |
|---------------|:------------:|---------------------------------|
| GPIO17 (BCM)  | Pin 11       | Set by `BUTTON_GPIO_PIN` in `.env` |
| GND           | Pin 9        | Any GND pin on the header works |

Physical pin numbering counts the 40-pin header with pin 1 at the corner
closest to the SD card slot. For reference, the top-left corner of the
header looks like this:

```
 1  2
 3  4
 5  6
 7  8
 9  10   <- pin 9 = GND
11  12   <- pin 11 = GPIO17
```

To find any pin on your specific board, run `pinout` (installed with
`gpiozero`) from inside the venv — it prints an ASCII diagram of your
exact Pi's header with every pin labeled.

**No button on hand yet?** A single jumper wire (or a paperclip) briefly
touching pin 11 and pin 9 together is electrically identical to a button
press — useful for testing before you wire up a real button.

This uses the Pi's internal pull-up resistor, so the pin reads HIGH when
the button is open and LOW when pressed (`BUTTON_PULL_UP=true`, the
default). If you wire it the other way (pin to 3.3V when pressed), set
`BUTTON_PULL_UP=false` in `.env`.

Change `BUTTON_GPIO_PIN` in `.env` if you use a different GPIO pin.

## How it connects to the main app

The Audio Guest Book backend (in `../backend`) runs a Socket.IO server.
This script connects to it as a client and emits `start_recording` /
`stop_recording`. The backend relays those as `remote:start_recording` /
`remote:stop_recording` to the guest kiosk browser tab, which calls the
same start/stop recording logic as the on-screen button.

For this to work:

- The guest kiosk (`/guest` page) must be open in a browser with an event
  already selected (on the "welcome" screen) for a remote start to do
  anything, and actively recording for a remote stop to do anything.
- `PI_SHARED_TOKEN` in this project's `.env` must match `PI_SHARED_TOKEN`
  in the backend's `backend/.env`.

The toggle state (recording / not recording) is tracked locally on the Pi
in memory. If this script restarts while a recording is in progress, it
forgets that state and will start back at "not recording" — press the
button twice if it ever seems out of sync with the kiosk screen.

## Setup on a fresh Raspberry Pi

### 1. Flash the OS and get SSH access

- Use Raspberry Pi Imager to flash **Raspberry Pi OS Lite (64-bit)** to the SD card.
  In the imager's advanced options (gear icon), set the hostname, enable SSH,
  and set your Wi-Fi/locale so it boots headless straight onto your network.
- Boot the Pi, then from your PC: `ssh pi@<hostname-or-ip>.local`

### 2. Install system packages

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip git
```

### 3. Get the project files onto the Pi

Only the `raspberry-pi-controller` folder is needed on the Pi (not the whole
Node/React app). Easiest options:

```bash
# Option A: clone the whole repo, only run from this subfolder
git clone <your-repo-url> ~/audio-guest-book
cd ~/audio-guest-book/raspberry-pi-controller

# Option B: copy just this folder from your PC via scp (run from your PC)
scp -r raspberry-pi-controller pi@<hostname-or-ip>.local:~/raspberry-pi-controller
```

### 4. Python setup

```bash
cd ~/raspberry-pi-controller   # or the path you cloned/copied to
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 5. Configure `.env`

```env
SERVER_URL=http://<backend-host-lan-ip>:5000
PI_SHARED_TOKEN=<same value as backend/.env PI_SHARED_TOKEN>
BUTTON_GPIO_PIN=17
```

`SERVER_URL` must point at wherever `backend/server.js` is actually running
(its LAN IP if it's on your PC/another Pi on the same network, e.g.
`http://192.168.1.50:5000`, or the production domain e.g.
`https://api.mouadhattia.xyz` if deployed). `PI_SHARED_TOKEN` must be copy-
pasted exactly from that backend's `.env` file.

### 6. Run it manually first (to check for errors)

```bash
python phone_button.py
```

You should see `[socket] connected to ...` and `[gpio] listening on GPIO17
...`. Press the button — you should see `[button] pressed -> emitting
'start_recording'`. Ctrl+C to stop.

## Testing without a Raspberry Pi

Set `SIMULATE=true` in `.env` (or `SIMULATE=true python phone_button.py`)
to skip GPIO entirely — press Enter in the terminal to simulate a button
press. Useful for verifying the Socket.IO connection and the kiosk
integration from a regular laptop before wiring up the real hardware.

### 7. Run automatically on boot (systemd)

If `python phone_button.py` worked in step 6, set it up to auto-start:

```bash
sudo cp audio-guest-book-button.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now audio-guest-book-button.service
```

Check status/logs:

```bash
sudo systemctl status audio-guest-book-button.service
journalctl -u audio-guest-book-button.service -f
```

Adjust `User`, `WorkingDirectory`, and `ExecStart` in the service file if
you didn't clone this into `/home/pi/raspberry-pi-controller`.

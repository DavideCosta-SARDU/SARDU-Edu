# SARDU Edu Desktop

This package contains the Electron application shell and the native hardware boundary for SARDU Edu. The Scratch GUI
runs in a sandboxed renderer. A context-isolated preload exposes only named operations for hardware resource status,
port discovery, compilation, upload and selection of the Live serial port.

Arduino toolchain versions are declared in `resources/toolchains/arduino/manifest.json`. Downloaded binaries,
platforms and libraries are local build resources and are not committed to Git.

Copyright (C) 2026 Davide Costa <davide@sardu.pro>

Licensed under the GNU Affero General Public License v3.0 only. See the repository `LICENSE` file.

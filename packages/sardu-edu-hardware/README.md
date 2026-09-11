# SARDU Edu Hardware

This package defines the hardware model used by SARDU Edu. It contains versioned definitions for boards, programming
backends, components and robots, together with a catalog and compatibility checks. The initial implementation includes
Arduino Uno and Arduino Nano definitions and generates Arduino C/C++ sketches from the corresponding editor blocks.
The generated operation model is shared with realtime transports, while toolchain invocation contracts remain
independent from the desktop process that executes them.

The package does not access serial ports or start compilers directly.

Copyright (C) 2026 Davide Costa <davide@sardu.pro>

Licensed under the GNU Affero General Public License v3.0 only. See the repository `LICENSE` file.

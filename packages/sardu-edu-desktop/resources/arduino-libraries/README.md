# Bundled Arduino libraries

`PN532_Seeed` contains only the `PN532` and `PN532_I2C` components copied from the Seeed Studio PN532 repository,
branch `arduino`, revision `2c47f5c836af53158c4e29685551612181fd8f9b`:

https://github.com/Seeed-Studio/PN532

The distributed files retain their original headers. The applicable BSD 3-Clause license and the copyright notices
for Adafruit Industries (2012) and Seeed Technology Inc. (2013) are included in both component directories.
`PN532_I2C.cpp` and `PN532_I2C.h` additionally identify `picospuch` as modifier. SARDU Edu removes the upstream
compile-time interface guard because this bundled component contains only I2C, and extends its constructor to pass
configurable SDA/SCL pins to `TwoWire::begin` on ESP32. The original AVR behavior remains unchanged.

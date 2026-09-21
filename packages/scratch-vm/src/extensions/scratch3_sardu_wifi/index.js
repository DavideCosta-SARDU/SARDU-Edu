const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

class Scratch3SarduWifi {
    constructor (runtime) {
        this.runtime = runtime;
    }

    getInfo () {
        const message = (id, defaultMessage, description) => formatMessage({
            id,
            default: defaultMessage,
            description
        });
        const selection = this.runtime?.sarduEdu?.hardwareSelection;
        const hidden = !selection?.boardId?.startsWith('esp32-') || !selection?.wifiEnabled ||
            selection?.mode !== 'standalone';
        return {
            id: 'sarduWifi',
            name: message('sarduWifi.category', 'ESP32 - Wi-Fi', 'Name of the ESP32 Wi-Fi blocks category'),
            color1: '#00695C',
            color2: '#00574C',
            color3: '#00443B',
            blocks: [
                {
                    opcode: 'connect',
                    text: message('sarduWifi.connect', 'connect to Wi-Fi [SSID] password [PASSWORD] timeout [SECONDS] seconds',
                        'Connect an ESP32 board to a Wi-Fi network'),
                    tooltip: message('sarduWifi.connect.tooltip',
                        'Connects to the specified Wi-Fi network and waits up to the selected number of seconds.',
                        'Tooltip for the ESP32 Wi-Fi connection block'),
                    blockType: BlockType.COMMAND,
                    hideFromPalette: hidden,
                    arguments: {
                        SSID: {type: ArgumentType.STRING, defaultValue: 'Wi-Fi'},
                        PASSWORD: {type: ArgumentType.STRING, defaultValue: 'password'},
                        SECONDS: {type: ArgumentType.NUMBER, defaultValue: 20}
                    }
                },
                {
                    opcode: 'disconnect',
                    text: message('sarduWifi.disconnect', 'disconnect Wi-Fi', 'Disconnect an ESP32 board from Wi-Fi'),
                    tooltip: message('sarduWifi.disconnect.tooltip', 'Disconnects the ESP32 from the Wi-Fi network.',
                        'Tooltip for the ESP32 Wi-Fi disconnection block'),
                    blockType: BlockType.COMMAND,
                    hideFromPalette: hidden
                },
                {
                    opcode: 'isConnected',
                    text: message('sarduWifi.isConnected', 'Wi-Fi connected?', 'Report whether ESP32 Wi-Fi is connected'),
                    tooltip: message('sarduWifi.isConnected.tooltip',
                        'Reports true when the ESP32 is connected to a Wi-Fi network.',
                        'Tooltip for the ESP32 Wi-Fi connection status block'),
                    blockType: BlockType.BOOLEAN,
                    disableMonitor: true,
                    hideFromPalette: hidden
                },
                {
                    opcode: 'localIp',
                    text: message('sarduWifi.localIp', 'Wi-Fi IP address', 'Report the ESP32 Wi-Fi IP address'),
                    tooltip: message('sarduWifi.localIp.tooltip',
                        'Reports the local IP address assigned to the ESP32.',
                        'Tooltip for the ESP32 Wi-Fi local IP block'),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    hideFromPalette: hidden
                }
            ]
        };
    }

    connect () {}

    disconnect () {}

    isConnected () {
        return false;
    }

    localIp () {
        return '';
    }
}

module.exports = Scratch3SarduWifi;

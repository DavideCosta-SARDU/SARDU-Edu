import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import VM from '@scratch/scratch-vm';
import {ARDUINO_BOARDS} from '@sardu-block/hardware';

import LibraryComponent from '../library/library.jsx';
import unoIcon from '../../../../../docs/SVG/Schede/arduino_uno.svg';
import nanoIcon from '../../../../../docs/SVG/Schede/Arduino_Nano.svg';
import esp32Icon from '../../../../../docs/SVG/ESP32.svg';
import {
    BOARD_DISCOVERY_TIMEOUTS,
    getBoardDiscoveryTimeout,
    setBoardDiscoveryTimeout
} from '../../lib/sardu-board-discovery-settings';
import styles from './board-library.css';

const BOARD_ITEMS = [
    {
        boardId: 'arduino-uno',
        featured: true,
        name: 'Arduino Uno',
        rawURL: unoIcon,
        description: <FormattedMessage
            id="gui.sardu.unoDescription"
            defaultMessage="ATmega328P board with digital, analog and PWM pins"
            description="Description of Arduino Uno in the board library"
        />
    },
    {
        boardId: 'arduino-nano',
        featured: true,
        name: 'Arduino Nano',
        rawURL: nanoIcon,
        description: <FormattedMessage
            id="gui.sardu.nanoDescription"
            defaultMessage="Compact ATmega328P board with two additional analog inputs"
            description="Description of Arduino Nano in the board library"
        />
    },
    {
        boardId: 'esp32-dev-module',
        wifiCapable: true,
        featured: true,
        name: 'ESP32 Dev Module',
        rawURL: esp32Icon,
        description: <FormattedMessage
            id="gui.sardu.esp32DevModule.description"
            defaultMessage="ESP32 development board with Wi-Fi and Bluetooth"
            description="Description of ESP32 Dev Module in the board library"
        />
    },
    {
        boardId: 'esp32-s2-dev-module',
        wifiCapable: true,
        featured: true,
        name: 'ESP32-S2 Dev Module',
        rawURL: esp32Icon,
        description: <FormattedMessage
            id="gui.sardu.esp32S2DevModule.description"
            defaultMessage="ESP32-S2 development board with Wi-Fi and native USB"
            description="Description of ESP32-S2 Dev Module in the board library"
        />
    },
    {
        boardId: 'esp32-s3-dev-module',
        wifiCapable: true,
        featured: true,
        name: 'ESP32-S3 Dev Module',
        rawURL: esp32Icon,
        description: <FormattedMessage
            id="gui.sardu.esp32S3DevModule.description"
            defaultMessage="ESP32-S3 development board with Wi-Fi, Bluetooth LE and native USB"
            description="Description of ESP32-S3 Dev Module in the board library"
        />
    },
    {
        boardId: 'esp32-c3-dev-module',
        wifiCapable: true,
        featured: true,
        name: 'ESP32-C3 Dev Module',
        rawURL: esp32Icon,
        description: <FormattedMessage
            id="gui.sardu.esp32C3DevModule.description"
            defaultMessage="RISC-V ESP32-C3 development board with Wi-Fi and Bluetooth LE"
            description="Description of ESP32-C3 Dev Module in the board library"
        />
    },
    {
        boardId: 'esp32-cam-ai-thinker',
        wifiCapable: true,
        featured: true,
        name: 'AI Thinker ESP32-CAM',
        rawURL: esp32Icon,
        description: <FormattedMessage
            id="gui.sardu.esp32CamAiThinker.description"
            defaultMessage="ESP32-CAM profile with the AI Thinker camera pin mapping"
            description="Description of AI Thinker ESP32-CAM in the board library"
        />
    }
];

const getDigitalOutputPins = boardId => ARDUINO_BOARDS.find(board => board.id === boardId)?.pins
    .filter(pin => pin.capabilities.includes('digital-output')).map(pin => pin.id) || [];
const getAnalogInputPins = boardId => ARDUINO_BOARDS.find(board => board.id === boardId)?.pins
    .filter(pin => pin.capabilities.includes('analog-input')).map(pin => pin.id) || [];
const getPwmPins = boardId => ARDUINO_BOARDS.find(board => board.id === boardId)?.pins
    .filter(pin => pin.capabilities.includes('pwm')).map(pin => pin.id) || [];
const getBusPins = boardId => Object.fromEntries((ARDUINO_BOARDS.find(board => board.id === boardId)?.buses || [])
    .map(bus => [bus.type, {...bus.signals}]));
const DISCOVERY_TIMEOUT_LABELS = {
    100: {
        id: 'gui.sardu.boardDiscoveryFastest',
        defaultMessage: 'Very fast',
        description: 'Fastest board discovery timeout option'
    },
    250: {
        id: 'gui.sardu.boardDiscoveryRecommended',
        defaultMessage: 'Fast (default)',
        description: 'Recommended board discovery timeout option'
    },
    500: {
        id: 'gui.sardu.boardDiscoveryCompatible',
        defaultMessage: 'More reliable',
        description: 'Compatible board discovery timeout option'
    },
    1000: {
        id: 'gui.sardu.boardDiscoveryMaximum',
        defaultMessage: 'Maximum wait',
        description: 'Maximum compatibility board discovery timeout option'
    }
};

export const canSelectBoard = (selectedBoardId, nextBoardId) =>
    !selectedBoardId || selectedBoardId === nextBoardId;

export const removeSelectedBoard = (vm, confirmRemoval) => {
    if (vm.clearSarduBlockHardwareSelection()) return true;
    if (!confirmRemoval()) return false;
    return vm.clearSarduBlockHardwareSelection(true);
};

const BoardLibrary = ({onRequestClose, vm}) => {
    const intl = useIntl();
    const selection = vm.getSarduBlockProjectData()?.hardwareSelection;
    const [selectedBoardName, setSelectedBoardName] = useState(selection?.boardName ||
        BOARD_ITEMS.find(item => item.boardId === selection?.boardId)?.name);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [discoveryTimeout, setDiscoveryTimeout] = useState(getBoardDiscoveryTimeout);
    const handleRemove = () => {
        if (!removeSelectedBoard(vm, () => window.confirm(intl.formatMessage({
            id: 'gui.sardu.removeBoardWithCode',
            defaultMessage: 'The board program contains blocks. Remove the board and permanently delete that code?',
            description: 'Confirmation before removing a board program which contains blocks'
        })))) return;
        setSelectedBoardName(null);
    };
    const handleSelect = (item, wifiEnabled = selection?.boardId === item.boardId && selection?.wifiEnabled) => {
        if (!canSelectBoard(selection?.boardId, item.boardId)) return;
        vm.setSarduBlockHardwareSelection({
            boardId: item.boardId,
            boardName: item.name,
            componentIds: selection?.componentIds || [],
            analogInputPins: getAnalogInputPins(item.boardId),
            busPins: getBusPins(item.boardId),
            hardwareKind: 'board',
            digitalOutputPins: getDigitalOutputPins(item.boardId),
            pwmPins: getPwmPins(item.boardId),
            boardVersion: '1',
            backendId: 'arduino-cpp',
            backendVersion: '1',
            mode: 'standalone',
            wifiEnabled: Boolean(wifiEnabled)
        });
        vm.setSarduBlockHardwarePort(null);
        const finishSelection = () => {
            vm.emit('SARDU_BLOCK_HARDWARE_CHANGED', vm.getSarduBlockProjectData());
            vm.emit('SARDU_BLOCK_CONNECT_REQUESTED', {afterSelection: true});
            setSelectedBoardName(item.name);
            onRequestClose();
        };
        if (vm.extensionManager.isExtensionLoaded('sarduBoard')) {
            void vm.extensionManager.refreshBlocks().then(finishSelection);
        } else {
            void vm.extensionManager.loadExtensionURL('sarduBoard').then(finishSelection);
        }
    };
    const boardItems = BOARD_ITEMS.map(item => ({
        ...item,
        disabled: !canSelectBoard(selection?.boardId, item.boardId),
        showDisabledLabel: false,
        description: <div>
            {item.description}
            {item.wifiCapable ? (
                <label
                    title={intl.formatMessage({
                        id: 'gui.sardu.wifiOption.tooltip',
                        defaultMessage: 'Enables the ESP32 Wi-Fi blocks for this board.',
                        description: 'Tooltip for the ESP32 Wi-Fi board option'
                    })}
                    onClick={event => event.stopPropagation()}
                >
                    <input
                        checked={selection?.boardId === item.boardId && Boolean(selection?.wifiEnabled)}
                        type="checkbox"
                        onChange={event => handleSelect(item, event.target.checked)}
                    />
                    <FormattedMessage
                        id="gui.sardu.wifiOption"
                        defaultMessage="Wi-Fi"
                        description="Label for the ESP32 Wi-Fi board option"
                    />
                </label>
            ) : null}
        </div>
    }));

    return (
        <LibraryComponent
            data={boardItems}
            filterable={false}
            headerAction={(
                <div className={styles.settings}>
                    <button
                        aria-expanded={settingsOpen}
                        aria-label={intl.formatMessage({
                            id: 'gui.sardu.boardTechnicalSettings',
                            defaultMessage: 'Technical settings',
                            description: 'Accessible label for board technical settings'
                        })}
                        className={styles.settingsButton}
                        title={intl.formatMessage({
                            id: 'gui.sardu.boardTechnicalSettings',
                            defaultMessage: 'Technical settings',
                            description: 'Tooltip for board technical settings'
                        })}
                        type="button"
                        onClick={() => setSettingsOpen(open => !open)}
                    >
                        ...
                    </button>
                    {settingsOpen ? (
                        <div className={styles.settingsPanel}>
                            <h2 className={styles.settingsTitle}>
                                <FormattedMessage
                                    id="gui.sardu.boardTechnicalSettings"
                                    defaultMessage="Technical settings"
                                    description="Title of board technical settings"
                                />
                            </h2>
                            <label className={styles.settingsLabel}>
                                <FormattedMessage
                                    id="gui.sardu.boardDiscoveryTimeout"
                                    defaultMessage="Maximum detection time"
                                    description="Label for Arduino CLI port discovery timeout"
                                />
                                <select
                                    className={styles.settingsSelect}
                                    value={discoveryTimeout}
                                    onChange={event => {
                                        const timeout = setBoardDiscoveryTimeout(event.target.value);
                                        setDiscoveryTimeout(timeout);
                                    }}
                                >
                                    {BOARD_DISCOVERY_TIMEOUTS.map(timeout => (
                                        <option key={timeout} value={timeout}>
                                            {`${timeout} ms - ${intl.formatMessage(DISCOVERY_TIMEOUT_LABELS[timeout])}`}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <p className={styles.settingsNote}>
                                <FormattedMessage
                                    id="gui.sardu.boardDiscoveryTimeoutNote"
                                    defaultMessage="Specifies how long Arduino CLI waits for discovery procedures to find connected boards. A lower value makes refreshing faster, but it might not detect boards or ports that respond slowly. If a board is not found, increase this value."
                                    description="Explanation below the board discovery timeout setting"
                                />
                            </p>
                        </div>
                    ) : null}
                </div>
            )}
            hardwareThumbnails
            id="boardLibrary"
            title={intl.formatMessage({
                id: 'gui.sardu.boardLibraryTitle',
                defaultMessage: 'Choose a board',
                description: 'Title of the SARDU-Block board library'
            })}
            onItemSelected={handleSelect}
            onItemRemove={handleRemove}
            onRequestClose={onRequestClose}
            removeItemLabel={intl.formatMessage({
                id: 'gui.sardu.removeBoard',
                defaultMessage: 'Remove selected board',
                description: 'Tooltip for removing the selected SARDU-Block board'
            })}
            selectedItemId={selectedBoardName}
        />
    );
};

BoardLibrary.propTypes = {
    onRequestClose: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default BoardLibrary;

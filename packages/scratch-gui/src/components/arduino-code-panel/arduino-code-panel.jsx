import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {connect} from 'react-redux';
import VM from '@scratch/scratch-vm';
import {ARDUINO_BOARDS, generateArduinoSketch, generateSarduLiveFirmware} from '@sardu-edu/hardware';

import downloadBlob from '../../lib/download-blob';
import getSarduDesktopHardware from '../../lib/sardu-desktop-api';
import {getDraggedPanelPosition} from '../../lib/sardu-panel-position';
import SarduSerialMonitor from '../../lib/sardu-serial-monitor';
import SarduSerialTransport from '../../lib/sardu-serial-transport';
import arduinoUnoImage from '../board-library/arduino-uno.svg';
import arduinoNanoImage from '../board-library/arduino-nano.svg';
import styles from './arduino-code-panel.css';

const boardImages = {
    'arduino-nano': arduinoNanoImage,
    'arduino-uno': arduinoUnoImage
};

const getFilename = projectTitle => {
    const safeTitle = projectTitle.trim().replace(/[\\/:*?"<>|]+/g, '-');
    return `${safeTitle || 'sardu-edu'}.ino`;
};

const getInitialDesktopState = () => ({
    available: false,
    checked: false,
    error: null,
    ports: [],
    resourcesReady: false,
    selectedPort: '',
    status: 'loading'
});

const getDisplayedSource = (generatedSource, manualSource) =>
    manualSource === null ? generatedSource : manualSource;

const getSerialBaudRate = source => {
    const match = /\bSerial\.begin\(\s*(\d+)\s*\)\s*;/.exec(source);
    return match ? Number(match[1]) : null;
};

const stripAnsi = value => value.replace(/[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*)?\u0007)|(?:(?:\d{1,4}(?:[;:]\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g, '');
const appendHardwareOutput = (current, output) => `${current}${stripAnsi(output.text)}`.slice(-100000);

const getArduinoPanelWidth = stageSize => ({
    large: 496,
    largeConstrained: 424,
    small: 256
}[stageSize] || 496);

const getCompatiblePorts = (ports, selectedBoard) => selectedBoard ? ports.filter(port =>
    port.matchingBoardFqbns.length === 0 || port.matchingBoardFqbns.includes(selectedBoard.fqbn)) : [];

const getPreselectedPort = (ports, previousPort) =>
    ports.some(port => port.address === previousPort) ? previousPort : (ports[0]?.address || '');

const ArduinoCodePanel = ({
    isFullScreen,
    onRequestClose,
    onStatusChange,
    projectTitle,
    stageSize,
    stagePaneWidth,
    viewMode,
    visible,
    vm
}) => {
    const intl = useIntl();
    const panelRef = useRef(null);
    const panelResizeRef = useRef(null);
    const dragRef = useRef(null);
    const monitorRef = useRef(null);
    const outputRef = useRef(null);
    const operationRunningRef = useRef(false);
    const sourceUpdateTimerRef = useRef(null);
    const connectionPromptRequestedRef = useRef(false);
    const selectedPortRef = useRef('');
    const selectedBoardRef = useRef(null);
    const transportRef = useRef(null);
    if (!transportRef.current) {
        transportRef.current = new SarduSerialTransport(undefined, diagnostic => {
            const entry = {...diagnostic, ...(selectedPortRef.current ? {port: selectedPortRef.current} : {})};
            console.info('SARDU Edu Live diagnostic', entry);
            onStatusChange({
                kind: /error|timeout/.test(entry.stage) ? 'error' : 'info',
                message: intl.formatMessage({
                    id: 'gui.sardu.status.liveDiagnostic',
                    defaultMessage: 'Live diagnostic: {stage}{detail}',
                    description: 'Detailed status for a SARDU Edu Live serial operation'
                }, {
                    stage: entry.stage,
                    detail: entry.detail ? ` — ${entry.detail}` : ''
                })
            });
            const hardware = getSarduDesktopHardware();
            if (hardware?.logLiveDiagnostic) {
                hardware.logLiveDiagnostic(entry).catch(error => {
                    console.warn('ArduinoCodePanel could not persist a Live diagnostic', error);
                });
            }
        });
    }
    const [bottomPanel, setBottomPanel] = useState('output');
    const [connectionPromptOpen, setConnectionPromptOpen] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [fullPage, setFullPage] = useState(false);
    const [hardwareOutput, setHardwareOutput] = useState('');
    const [liveState, setLiveState] = useState({status: 'disconnected', error: null});
    const [manualSource, setManualSource] = useState(null);
    const [minimized, setMinimized] = useState(false);
    const [monitorBaudRate, setMonitorBaudRate] = useState('9600');
    const [monitorState, setMonitorState] = useState({error: null, status: 'disconnected'});
    const [position, setPosition] = useState(null);
    const [serialOutput, setSerialOutput] = useState('');
    const [snapshot, setSnapshot] = useState(() => ({selection: null, source: '', error: null}));
    const [sourceEditing, setSourceEditing] = useState(false);
    const [desktopState, setDesktopState] = useState(getInitialDesktopState);
    const displayedSource = getDisplayedSource(snapshot.source, manualSource);
    const sourceError = manualSource === null ? snapshot.error : null;
    const sourceSerialBaudRate = getSerialBaudRate(displayedSource);
    const serialBaudRate = Number(monitorBaudRate);
    if (!monitorRef.current) {
        monitorRef.current = new SarduSerialMonitor(undefined, chunk => {
            setSerialOutput(current => `${current}${chunk}`.slice(-100000));
        }, diagnostic => {
            if (diagnostic.stage === 'serial-monitor-error') {
                setMonitorState({error: diagnostic.detail, status: 'connected'});
            }
            onStatusChange({
                kind: diagnostic.stage.endsWith('error') ? 'error' : 'info',
                message: intl.formatMessage({
                    id: 'gui.sardu.status.serialMonitorDiagnostic',
                    defaultMessage: 'Serial monitor: {stage}{detail}',
                    description: 'Detailed status for the Offline Arduino serial monitor'
                }, {
                    stage: diagnostic.stage,
                    detail: diagnostic.detail ? ` — ${diagnostic.detail}` : ''
                })
            });
        });
    }

    useEffect(() => {
        const hardware = getSarduDesktopHardware();
        if (!hardware?.onOutput) return undefined;
        return hardware.onOutput(output => {
            setHardwareOutput(current => appendHardwareOutput(current, output));
        });
    }, []);

    useEffect(() => {
        const output = outputRef.current;
        if (output) output.scrollTop = output.scrollHeight;
    }, [bottomPanel, hardwareOutput, serialOutput]);

    useEffect(() => {
        if (!fullPage && panelRef.current) {
            panelRef.current.style.width = `${stagePaneWidth || getArduinoPanelWidth(stageSize)}px`;
            setPosition(null);
        }
    }, [fullPage, stagePaneWidth, stageSize]);

    const updateSource = useCallback(() => {
        const selection = vm.getSarduEduProjectData()?.hardwareSelection || null;
        if (!selection) {
            setSnapshot({selection: null, source: '', error: null});
            return;
        }
        try {
            const source = generateArduinoSketch({
                boardId: selection.boardId,
                targets: vm.runtime.targets
                    .filter(target => target.isOriginal)
                    .map(target => ({blocks: target.blocks._blocks}))
            });
            setSnapshot({selection, source, error: null});
        } catch (error) {
            setSnapshot({selection, source: '', error: error.message});
        }
    }, [vm]);

    const refreshDesktop = useCallback(async (showLoading = true) => {
        if (operationRunningRef.current) return;
        const hardware = getSarduDesktopHardware();
        if (!hardware) {
            selectedPortRef.current = '';
            vm.setSarduEduSelectedPort(null);
            vm.setSarduEduHardwarePort(null);
            setDesktopState(current => ({
                ...current,
                available: false,
                checked: true,
                ports: [],
                resourcesReady: false,
                selectedPort: '',
                status: 'idle'
            }));
            return;
        }

        if (showLoading) {
            setDesktopState(current => ({...current, available: true, error: null, status: 'loading'}));
        }
        try {
            const resourceStatus = await hardware.getStatus();
            const resourcesReady = resourceStatus.arduinoCliAvailable && resourceStatus.arduinoCoreAvailable;
            const detectedPorts = resourcesReady ? await hardware.listPorts() : [];
            const selectedBoardId = vm.getSarduEduProjectData()?.hardwareSelection?.boardId;
            const selectedBoard = ARDUINO_BOARDS.find(board => board.id === selectedBoardId);
            const ports = getCompatiblePorts(detectedPorts, selectedBoard);
            const previousPort = selectedPortRef.current;
            const selectedPort = getPreselectedPort(ports, previousPort);
            selectedPortRef.current = selectedPort;
            vm.setSarduEduSelectedPort(selectedPort || null);
            if (vm.runtime.sarduEduHardwarePort && vm.runtime.sarduEduHardwarePort !== selectedPort) {
                vm.setSarduEduHardwarePort(null);
            }
            setDesktopState(current => ({
                ...current,
                available: true,
                checked: true,
                error: null,
                ports,
                resourcesReady,
                selectedPort,
                status: showLoading ? 'idle' : current.status
            }));
            if (selectedPort && connectionPromptRequestedRef.current && !vm.runtime.sarduEduHardwarePort) {
                connectionPromptRequestedRef.current = false;
                setConnectionPromptOpen(true);
            }
        } catch (error) {
            selectedPortRef.current = '';
            vm.setSarduEduSelectedPort(null);
            vm.setSarduEduHardwarePort(null);
            setDesktopState(current => ({
                ...current,
                available: true,
                checked: true,
                error: error.message,
                status: 'idle'
            }));
        }
    }, [vm]);

    useEffect(() => {
        const events = ['PROJECT_CHANGED', 'targetsUpdate', 'workspaceUpdate', 'SARDU_HARDWARE_CHANGED'];
        const scheduleSourceUpdate = () => {
            window.clearTimeout(sourceUpdateTimerRef.current);
            sourceUpdateTimerRef.current = window.setTimeout(updateSource, 0);
        };
        events.forEach(event => vm.on(event, scheduleSourceUpdate));
        updateSource();
        return () => {
            window.clearTimeout(sourceUpdateTimerRef.current);
            events.forEach(event => vm.removeListener(event, scheduleSourceUpdate));
        };
    }, [updateSource, vm]);

    useEffect(() => {
        const handleConnectionChange = async () => {
            const connectedPort = vm.runtime.sarduEduHardwarePort;
            if (!connectedPort) {
                vm.setSarduEduLiveTransport(null);
                try {
                    if (transportRef.current.connected) await transportRef.current.disconnect();
                    if (monitorRef.current.connected) await monitorRef.current.disconnect();
                    setLiveState({status: 'disconnected', error: null});
                    setMonitorState({status: 'disconnected', error: null});
                } catch (error) {
                    console.warn('ArduinoCodePanel could not close the selected serial port', error);
                    setLiveState({status: 'disconnected', error: error.message});
                    setMonitorState({status: 'disconnected', error: error.message});
                }
                return;
            }
            if (snapshot.selection?.mode !== 'realtime' || transportRef.current.connected) return;
            setLiveState({status: 'connecting', error: null});
            try {
                await getSarduDesktopHardware().selectLivePort(connectedPort);
                await transportRef.current.connect();
                vm.setSarduEduLiveTransport(transportRef.current);
                setLiveState({status: 'connected', error: null});
            } catch (error) {
                vm.setSarduEduLiveTransport(null);
                vm.setSarduEduHardwarePort(null);
                setLiveState({status: 'disconnected', error: error.message});
            }
        };
        vm.on('SARDU_HARDWARE_CHANGED', handleConnectionChange);
        void handleConnectionChange();
        return () => vm.removeListener('SARDU_HARDWARE_CHANGED', handleConnectionChange);
    }, [snapshot.selection?.mode, vm]);

    useEffect(() => {
        const handlePointerMove = event => {
            const panel = panelRef.current;
            const resize = panelResizeRef.current;
            if (panel && resize) {
                panel.style.width = `${Math.max(240, Math.min(resize.maxWidth,
                    resize.startWidth + resize.startX - event.clientX))}px`;
                return;
            }
            const drag = dragRef.current;
            const parent = panel?.offsetParent;
            if (!panel || !drag || !parent) return;

            const panelRect = panel.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            setPosition(getDraggedPanelPosition({
                dragOffsetX: drag.offsetX,
                dragOffsetY: drag.offsetY,
                panelHeight: panelRect.height,
                panelWidth: panelRect.width,
                parentHeight: parentRect.height,
                parentWidth: parentRect.width,
                pointerX: event.clientX - parentRect.left,
                pointerY: event.clientY - parentRect.top
            }));
        };
        const handlePointerUp = () => {
            dragRef.current = null;
            panelResizeRef.current = null;
            setDragging(false);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, []);

    useEffect(() => () => {
        vm.setSarduEduLiveTransport(null);
        transportRef.current.disconnect().catch(error => {
            console.warn('ArduinoCodePanel cleanup could not close the serial port', error);
        });
        monitorRef.current.disconnect().catch(error => {
            console.warn('ArduinoCodePanel cleanup could not close the serial monitor', error);
        });
    }, [vm]);

    const selectedBoardId = snapshot.selection?.boardId || null;
    useEffect(() => {
        if (visible && selectedBoardId) refreshDesktop();
    }, [refreshDesktop, selectedBoardId, visible]);
    useEffect(() => {
        const handleConnectRequest = request => {
            connectionPromptRequestedRef.current = true;
            if (request?.afterSelection) return;
            if (selectedPortRef.current && !vm.runtime.sarduEduHardwarePort) {
                connectionPromptRequestedRef.current = false;
                setConnectionPromptOpen(true);
            }
        };
        vm.on('SARDU_CONNECT_REQUESTED', handleConnectRequest);
        return () => vm.removeListener('SARDU_CONNECT_REQUESTED', handleConnectRequest);
    }, [vm]);
    useEffect(() => {
        const previousBoardId = selectedBoardRef.current;
        selectedBoardRef.current = selectedBoardId;
        selectedPortRef.current = '';
        setConnectionPromptOpen(false);
        vm.setSarduEduSelectedPort(null);
        if (previousBoardId && previousBoardId !== selectedBoardId) {
            setManualSource(null);
            setSourceEditing(false);
            monitorRef.current.disconnect().then(() => {
                setMonitorState({error: null, status: 'disconnected'});
            }).catch(error => {
                setMonitorState({error: error.message, status: 'disconnected'});
            });
        }
        if (!previousBoardId || previousBoardId === selectedBoardId || !transportRef.current.connected) return;

        vm.setSarduEduLiveTransport(null);
        transportRef.current.disconnect().then(() => {
            setLiveState({status: 'disconnected', error: null});
        }).catch(error => {
            console.warn('ArduinoCodePanel could not disconnect after the selected board changed', error);
            setLiveState({status: 'disconnected', error: error.message});
        });
    }, [selectedBoardId, vm]);

    useEffect(() => {
        if (!selectedBoardId) return undefined;
        const interval = window.setInterval(() => refreshDesktop(false), 2000);
        return () => window.clearInterval(interval);
    }, [refreshDesktop, selectedBoardId]);

    useEffect(() => {
        if (!snapshot.selection) {
            onStatusChange(null);
            return;
        }
        const boardName = snapshot.selection.boardName || snapshot.selection.boardId;
        const port = desktopState.selectedPort;
        let kind = 'info';
        let message;
        if (sourceError) {
            kind = 'error';
            message = intl.formatMessage({id: 'gui.sardu.status.codeError'}, {message: sourceError});
        } else if (!desktopState.checked || desktopState.status === 'loading') {
            message = intl.formatMessage({id: 'gui.sardu.status.searchingUsb'}, {board: boardName});
        } else if (desktopState.error) {
            kind = 'error';
            message = intl.formatMessage({id: 'gui.sardu.status.hardwareError'}, {message: desktopState.error});
        } else if (!desktopState.available) {
            kind = 'error';
            message = intl.formatMessage({id: 'gui.sardu.status.desktopRequired'});
        } else if (!desktopState.resourcesReady) {
            kind = 'error';
            message = intl.formatMessage({id: 'gui.sardu.status.resourcesMissing'});
        } else if (desktopState.status === 'compiling') {
            message = intl.formatMessage({id: 'gui.sardu.status.compiling'}, {board: boardName});
        } else if (desktopState.status === 'uploading') {
            message = intl.formatMessage({id: 'gui.sardu.status.uploading'}, {board: boardName, port});
        } else if (liveState.error) {
            kind = 'error';
            message = intl.formatMessage({id: 'gui.sardu.status.liveError'}, {message: liveState.error, port});
        } else if (liveState.status === 'connecting') {
            message = intl.formatMessage({id: 'gui.sardu.status.connecting'}, {board: boardName, port});
        } else if (liveState.status === 'connected') {
            kind = 'success';
            message = intl.formatMessage({id: 'gui.sardu.status.connected'}, {board: boardName, port});
        } else if (port) {
            kind = desktopState.status === 'compiled' || desktopState.status === 'uploaded' ? 'success' : 'info';
            message = intl.formatMessage({
                id: desktopState.status === 'compiled' ? 'gui.sardu.status.compiled' :
                    desktopState.status === 'uploaded' ? 'gui.sardu.status.uploaded' : 'gui.sardu.status.boardFound'
            }, {board: boardName, port});
        } else {
            message = intl.formatMessage({id: 'gui.sardu.status.searchingUsb'}, {board: boardName});
        }
        onStatusChange({kind, message});
    }, [desktopState, intl, liveState, onStatusChange, snapshot.selection, sourceError]);

    if (!visible || viewMode === 'stage' || !snapshot.selection) return null;

    const board = ARDUINO_BOARDS.find(candidate => candidate.id === snapshot.selection.boardId);
    const operationRunning = desktopState.status === 'compiling' || desktopState.status === 'uploading';
    const monitorActive = monitorState.status !== 'disconnected';
    const canUseToolchain = desktopState.available && desktopState.resourcesReady && !operationRunning;
    const connectedPort = vm.runtime.sarduEduHardwarePort;
    const canUpload = canUseToolchain && Boolean(connectedPort && connectedPort === desktopState.selectedPort);
    const canOpenMonitor = desktopState.available && desktopState.resourcesReady &&
        Boolean(connectedPort && connectedPort === desktopState.selectedPort) && Boolean(serialBaudRate) && !operationRunning &&
        monitorState.status === 'disconnected' && monitorRef.current.supported;
    const handleExport = () => downloadBlob(
        getFilename(projectTitle),
        new Blob([displayedSource], {type: 'text/x-arduino;charset=utf-8'})
    );
    const handleModeChange = async event => {
        const mode = event.target.value;
        if (mode === 'realtime' && monitorRef.current.connected) {
            try {
                await monitorRef.current.disconnect();
                setMonitorState({error: null, status: 'disconnected'});
            } catch (error) {
                setMonitorState({error: error.message, status: 'disconnected'});
                return;
            }
        }
        if (mode === 'standalone' && transportRef.current.connected) {
            vm.setSarduEduLiveTransport(null);
            try {
                await transportRef.current.disconnect();
            } catch (error) {
                console.warn('ArduinoCodePanel could not disconnect while changing mode', error);
            }
        }
        vm.setSarduEduHardwareSelection({...snapshot.selection, mode});
        setLiveState({status: 'disconnected', error: null});
        setDesktopState(current => ({...current, error: null, status: 'idle'}));
    };
    const handleDesktopOperation = async (status, operation) => {
        operationRunningRef.current = true;
        setBottomPanel('output');
        setHardwareOutput(`${intl.formatMessage({
            id: status === 'compiling' ? 'gui.sardu.compiling' : 'gui.sardu.uploading'
        })}\n`);
        setDesktopState(current => ({...current, error: null, status}));
        try {
            await operation();
            setDesktopState(current => ({
                ...current,
                error: null,
                status: status === 'compiling' ? 'compiled' : 'uploaded'
            }));
        } catch (error) {
            setDesktopState(current => ({...current, error: error.message, status: 'idle'}));
        } finally {
            operationRunningRef.current = false;
        }
    };
    const handleCompile = () => handleDesktopOperation('compiling', () => getSarduDesktopHardware().compile({
        boardId: snapshot.selection.boardId,
        source: displayedSource
    }));
    const handleUpload = () => handleDesktopOperation('uploading', async () => {
        if (monitorRef.current.connected) {
            await monitorRef.current.disconnect();
            setMonitorState({error: null, status: 'disconnected'});
        }
        return getSarduDesktopHardware().upload({
            boardId: snapshot.selection.boardId,
            port: desktopState.selectedPort,
            source: displayedSource
        });
    });
    const handleInstallLive = () => handleDesktopOperation('uploading', () => getSarduDesktopHardware().upload({
        boardId: snapshot.selection.boardId,
        port: desktopState.selectedPort,
        source: generateSarduLiveFirmware()
    }));
    const handleMonitorConnect = async () => {
        if (!serialBaudRate) {
            setMonitorState({
                error: intl.formatMessage({
                    id: 'gui.sardu.serialMonitorBaudRequired',
                    defaultMessage: 'Add a serial initialization block with a fixed baud rate before opening the monitor.',
                    description: 'Error shown when the Offline serial monitor has no fixed baud rate'
                }),
                status: 'disconnected'
            });
            return;
        }
        setMonitorState({error: null, status: 'connecting'});
        try {
            await getSarduDesktopHardware().selectLivePort(desktopState.selectedPort);
            await monitorRef.current.connect(serialBaudRate);
            setMonitorState({error: null, status: 'connected'});
        } catch (error) {
            setMonitorState({error: error.message, status: 'disconnected'});
        }
    };
    const handleMonitorDisconnect = async () => {
        try {
            await monitorRef.current.disconnect();
            setMonitorState({error: null, status: 'disconnected'});
        } catch (error) {
            setMonitorState({error: error.message, status: 'disconnected'});
        }
    };
    const handleShowOutput = async () => {
        setBottomPanel('output');
        if (monitorRef.current.connected) await handleMonitorDisconnect();
    };
    const handleShowSerial = () => {
        setBottomPanel('serial');
        if (sourceSerialBaudRate && canOpenMonitor) void handleMonitorConnect();
    };
    const handlePointerDown = event => {
        if (minimized && !event.target.closest('button')) {
            setMinimized(false);
            return;
        }
        if (fullPage || event.target.closest('button')) return;
        const panelRect = panelRef.current.getBoundingClientRect();
        dragRef.current = {
            offsetX: event.clientX - panelRect.left,
            offsetY: event.clientY - panelRect.top
        };
        setDragging(true);
        event.preventDefault();
    };
    const handlePanelResizePointerDown = event => {
        panelResizeRef.current = {
            maxWidth: panelRef.current.offsetParent?.clientWidth || window.innerWidth,
            startWidth: panelRef.current.getBoundingClientRect().width,
            startX: event.clientX
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        event.preventDefault();
        event.stopPropagation();
    };
    const panelStyle = position && viewMode === 'combined' && !fullPage ? {
        left: `${position.left}px`,
        right: 'auto',
        top: `${position.top}px`
    } : null;

    return (
        <React.Fragment>
            {connectionPromptOpen ? (
                <div className={styles.connectionPromptBackdrop} role="presentation">
                    <section
                        aria-labelledby="sardu-board-detected-title"
                        aria-modal="true"
                        className={styles.connectionPrompt}
                        role="dialog"
                    >
                        {boardImages[snapshot.selection.boardId] ? (
                            <img
                                alt=""
                                className={styles.connectionPromptImage}
                                src={boardImages[snapshot.selection.boardId]}
                            />
                        ) : null}
                        <div className={styles.connectionPromptContent}>
                            <h2 id="sardu-board-detected-title">
                                <FormattedMessage
                                    id="gui.sardu.boardDetectedTitle"
                                    defaultMessage="Board detected"
                                    description="Title of the board connection confirmation dialog"
                                />
                            </h2>
                            <p>
                                <FormattedMessage
                                    id="gui.sardu.boardDetectedMessage"
                                    defaultMessage="{board} was detected on {port}. Please verify the information before connecting."
                                    description="Message in the board connection confirmation dialog"
                                    values={{board: board?.name || snapshot.selection.boardName, port: desktopState.selectedPort}}
                                />
                            </p>
                            <label className={styles.connectionPromptPort}>
                                <FormattedMessage
                                    id="gui.sardu.connectionPort"
                                    defaultMessage="Serial port"
                                    description="Serial port label in the board connection dialog"
                                />
                                <select
                                    value={desktopState.selectedPort}
                                    onChange={event => {
                                        selectedPortRef.current = event.target.value;
                                        vm.setSarduEduSelectedPort(event.target.value || null);
                                        setDesktopState(current => ({...current, selectedPort: event.target.value}));
                                    }}
                                >
                                    {desktopState.ports.map(port => (
                                        <option key={port.address} value={port.address}>{port.label} ({port.address})</option>
                                    ))}
                                </select>
                            </label>
                            <div className={styles.connectionPromptActions}>
                                <button
                                    className={styles.connectionPromptCancel}
                                    type="button"
                                    onClick={() => {
                                        connectionPromptRequestedRef.current = false;
                                        setConnectionPromptOpen(false);
                                    }}
                                >
                                    <FormattedMessage
                                        id="gui.sardu.cancelConnection"
                                        defaultMessage="Cancel"
                                        description="Cancel button in the board connection dialog"
                                    />
                                </button>
                                <button
                                    className={styles.connectionPromptConfirm}
                                    type="button"
                                    disabled={!desktopState.selectedPort}
                                    onClick={() => {
                                        connectionPromptRequestedRef.current = false;
                                        vm.setSarduEduHardwarePort(desktopState.selectedPort);
                                        setConnectionPromptOpen(false);
                                    }}
                                >
                                    <FormattedMessage
                                        id="gui.sardu.confirmConnection"
                                        defaultMessage="Confirm and connect"
                                        description="Confirm button in the board connection dialog"
                                    />
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            ) : null}
        <section
            ref={panelRef}
            className={`${styles.panel} ${viewMode === 'code' && snapshot.selection.mode === 'standalone' ?
                styles.codeOnly : ''} ${
                fullPage ? styles.fullPage : ''
            } ${minimized ? styles.minimized : ''} ${isFullScreen ? styles.stageFullScreen : ''}`}
            style={panelStyle}
            aria-label={intl.formatMessage({
                id: 'gui.sardu.arduinoCode',
                defaultMessage: 'Arduino code',
                description: 'Title of the generated Arduino source panel'
            })}
        >
            <div
                className={`${styles.header} ${dragging ? styles.dragging : ''}`}
                onPointerDown={handlePointerDown}
            >
                <span className={styles.title}>
                    <FormattedMessage
                        id="gui.sardu.arduinoCode"
                        defaultMessage="Arduino code"
                        description="Title of the generated Arduino source panel"
                    />
                    {board ? ` — ${board.name}` : ''}
                </span>
                <div className={styles.headerActions}>
                    {snapshot.selection.mode === 'standalone' ? (
                        <button
                            className={styles.headerButton}
                            type="button"
                            aria-label={intl.formatMessage(sourceEditing ? {
                                id: 'gui.sardu.lockArduinoCode',
                                defaultMessage: 'Lock Arduino code',
                                description: 'Button that finishes manual Arduino source editing'
                            } : {
                                id: 'gui.sardu.editArduinoCode',
                                defaultMessage: 'Edit Arduino code',
                                description: 'Button that enables manual Arduino source editing'
                            })}
                            aria-pressed={sourceEditing}
                            title={intl.formatMessage(sourceEditing ? {
                                id: 'gui.sardu.lockArduinoCode',
                                defaultMessage: 'Lock Arduino code',
                                description: 'Button that finishes manual Arduino source editing'
                            } : {
                                id: 'gui.sardu.editArduinoCode',
                                defaultMessage: 'Edit Arduino code',
                                description: 'Button that enables manual Arduino source editing'
                            })}
                            onClick={() => {
                                if (!sourceEditing && manualSource === null) setManualSource(snapshot.source);
                                setSourceEditing(current => !current);
                            }}
                        >
                            {sourceEditing ? '✎' : '🔒'}
                        </button>
                    ) : null}
                    <button
                        className={styles.headerButton}
                        type="button"
                        aria-label={intl.formatMessage({
                            id: 'gui.sardu.smallCodeWindow',
                            defaultMessage: 'Use a small Arduino code window'
                        })}
                        title={intl.formatMessage({
                            id: 'gui.sardu.smallCodeWindow',
                            defaultMessage: 'Use a small Arduino code window'
                        })}
                        onClick={() => {
                            setFullPage(false);
                            setMinimized(false);
                            setPosition(null);
                            if (panelRef.current) panelRef.current.style.width = '320px';
                        }}
                    >
                        ▣
                    </button>
                    <button
                        className={styles.headerButton}
                        type="button"
                        aria-label={intl.formatMessage({
                            id: 'gui.sardu.matchStageCodeWindow',
                            defaultMessage: 'Match the Arduino code window to the Stage'
                        })}
                        title={intl.formatMessage({
                            id: 'gui.sardu.matchStageCodeWindow',
                            defaultMessage: 'Match the Arduino code window to the Stage'
                        })}
                        onClick={() => {
                            setFullPage(false);
                            setMinimized(false);
                            setPosition(null);
                            if (panelRef.current) {
                                panelRef.current.style.width = `${stagePaneWidth || getArduinoPanelWidth(stageSize)}px`;
                            }
                        }}
                    >
                        ▱
                    </button>
                    <button
                        className={styles.headerButton}
                        type="button"
                        aria-label={intl.formatMessage(fullPage ? {
                            id: 'gui.sardu.restoreCodeWindow',
                            defaultMessage: 'Restore code window',
                            description: 'Button that restores the Arduino code window'
                        } : {
                            id: 'gui.sardu.showCodeFullPage',
                            defaultMessage: 'Show code full page',
                            description: 'Button that expands the Arduino code window'
                        })}
                        aria-pressed={fullPage}
                        title={intl.formatMessage(fullPage ? {
                            id: 'gui.sardu.restoreCodeWindow',
                            defaultMessage: 'Restore code window',
                            description: 'Button that restores the Arduino code window'
                        } : {
                            id: 'gui.sardu.showCodeFullPage',
                            defaultMessage: 'Show code full page',
                            description: 'Button that expands the Arduino code window'
                        })}
                        onClick={() => {
                            setMinimized(false);
                            setPosition(null);
                            setFullPage(current => !current);
                        }}
                    >
                        {fullPage ? '❐' : '□'}
                    </button>
                    <button
                        className={styles.headerButton}
                        type="button"
                        aria-label={intl.formatMessage(minimized ? {
                            id: 'gui.sardu.restoreMinimizedCodeWindow',
                            defaultMessage: 'Restore Arduino code window'
                        } : {
                            id: 'gui.sardu.minimizeCodeWindow',
                            defaultMessage: 'Minimize Arduino code window'
                        })}
                        title={intl.formatMessage(minimized ? {
                            id: 'gui.sardu.restoreMinimizedCodeWindow',
                            defaultMessage: 'Restore Arduino code window'
                        } : {
                            id: 'gui.sardu.minimizeCodeWindow',
                            defaultMessage: 'Minimize Arduino code window'
                        })}
                        onClick={() => {
                            setFullPage(false);
                            setPosition(null);
                            setMinimized(current => !current);
                        }}
                    >
                        {minimized ? '▴' : '—'}
                    </button>
                    <button
                        className={styles.headerButton}
                        type="button"
                        aria-label={intl.formatMessage({
                            id: 'gui.sardu.closeCodeWindow',
                            defaultMessage: 'Close code window',
                            description: 'Button that closes the Arduino code window'
                        })}
                        title={intl.formatMessage({
                            id: 'gui.sardu.closeCodeWindow',
                            defaultMessage: 'Close code window',
                            description: 'Button that closes the Arduino code window'
                        })}
                        onClick={() => {
                            setFullPage(false);
                            setMinimized(false);
                            onRequestClose();
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>
            {!fullPage && !minimized ? (
                <div
                    className={styles.horizontalResizeHandle}
                    role="separator"
                    aria-orientation="vertical"
                    title={intl.formatMessage({
                        id: 'gui.sardu.resizeCodeWindow',
                        defaultMessage: 'Resize Arduino code window'
                    })}
                    onPointerDown={handlePanelResizePointerDown}
                >
                    ↔
                </div>
            ) : null}
            <div className={styles.controls}>
                <select className={styles.modeSelect} value={snapshot.selection.mode} onChange={handleModeChange}>
                    <option value="standalone">
                        {intl.formatMessage({
                            id: 'gui.sardu.offlineMode',
                            defaultMessage: 'Offline',
                            description: 'Arduino standalone programming mode'
                        })}
                    </option>
                    <option value="realtime">
                        {intl.formatMessage({
                            id: 'gui.sardu.liveMode',
                            defaultMessage: 'Live',
                            description: 'Arduino live programming mode'
                        })}
                    </option>
                </select>
                <select
                    className={styles.portSelect}
                    value={desktopState.selectedPort}
                    disabled={
                        !desktopState.resourcesReady || operationRunning || transportRef.current.connected || monitorActive
                    }
                    onChange={event => {
                        selectedPortRef.current = event.target.value;
                        vm.setSarduEduSelectedPort(event.target.value || null);
                        if (vm.runtime.sarduEduHardwarePort !== event.target.value) {
                            vm.setSarduEduHardwarePort(null);
                        }
                        setDesktopState(current => ({...current, selectedPort: event.target.value}));
                    }}
                >
                    <option value="">
                        {intl.formatMessage({
                            id: 'gui.sardu.selectPort',
                            defaultMessage: 'Select port',
                            description: 'Placeholder for the Arduino serial port selector'
                        })}
                    </option>
                    {desktopState.ports.map(port => (
                        <option key={port.address} value={port.address}>{port.label} ({port.address})</option>
                    ))}
                </select>
                <button
                    className={styles.controlButton}
                    disabled={operationRunning || monitorActive}
                    onClick={() => refreshDesktop()}
                >
                    <FormattedMessage
                        id="gui.sardu.refreshPorts"
                        defaultMessage="Refresh ports"
                        description="Button that refreshes detected Arduino ports"
                    />
                </button>
                {snapshot.selection.mode === 'standalone' ? (
                    <React.Fragment>
                        <button
                            className={styles.controlButton}
                            disabled={Boolean(sourceError)}
                            onClick={handleExport}
                        >
                            <FormattedMessage
                                id="gui.sardu.exportIno"
                                defaultMessage="Export .ino"
                                description="Button that exports the standalone Arduino sketch"
                            />
                        </button>
                        <button
                            className={styles.controlButton}
                            disabled={!canUseToolchain || Boolean(sourceError)}
                            onClick={handleCompile}
                        >
                            <FormattedMessage
                                id="gui.sardu.compile"
                                defaultMessage="Compile"
                                description="Button that compiles the generated Arduino sketch"
                            />
                        </button>
                        <button
                            className={styles.controlButton}
                            disabled={!canUpload || Boolean(sourceError)}
                            onClick={handleUpload}
                        >
                            <FormattedMessage
                                id="gui.sardu.upload"
                                defaultMessage="Upload"
                                description="Button that compiles and uploads the generated Arduino sketch"
                            />
                        </button>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <button
                            className={styles.controlButton}
                            disabled={!canUpload || transportRef.current.connected}
                            onClick={handleInstallLive}
                        >
                            <FormattedMessage
                                id="gui.sardu.installLive"
                                defaultMessage="Install Live firmware"
                                description="Button that compiles and uploads the SARDU Edu Live firmware"
                            />
                        </button>
                    </React.Fragment>
                )}
            </div>
            {snapshot.selection.mode === 'realtime' ? (
                <div className={styles.liveGuide}>
                    <strong>
                        <FormattedMessage
                            id="gui.sardu.liveGuideTitle"
                            defaultMessage="Prepare Live mode"
                            description="Title of the guided Live connection steps"
                        />
                    </strong>
                    <ol>
                        <li className={desktopState.selectedPort ? styles.stepComplete : ''}>
                            <FormattedMessage
                                id="gui.sardu.liveGuide.detect"
                                defaultMessage="Detect and select the Arduino board"
                                description="First guided Live connection step"
                            />
                        </li>
                        <li className={
                            desktopState.status === 'uploaded' || liveState.status === 'connected' ?
                                styles.stepComplete : ''
                        }>
                            <FormattedMessage
                                id="gui.sardu.liveGuide.firmware"
                                defaultMessage="Install the SARDU Edu Live firmware"
                                description="Second guided Live connection step"
                            />
                        </li>
                        <li className={liveState.status === 'connected' ? styles.stepComplete : ''}>
                            <FormattedMessage
                                id="gui.sardu.liveGuide.connect"
                                defaultMessage="Connect and verify communication"
                                description="Third guided Live connection step"
                            />
                        </li>
                    </ol>
                </div>
            ) : null}
            <div className={styles.liveStatus}>
                {!desktopState.checked || desktopState.status === 'loading' ? (
                    <FormattedMessage
                        id="gui.sardu.status.searchingUsb"
                        defaultMessage="Searching for {board} on USB…"
                        description="Status shown while looking for the selected Arduino board"
                        values={{board: board?.name || snapshot.selection.boardName}}
                    />
                ) : desktopState.error ? (
                    <FormattedMessage
                        id="gui.sardu.hardwareError"
                        defaultMessage="Hardware error: {message}"
                        description="Error shown when a desktop hardware operation fails"
                        values={{message: desktopState.error}}
                    />
                ) : !desktopState.available ? (
                    <FormattedMessage
                        id="gui.sardu.desktopRequired"
                        defaultMessage="Compilation and upload require the SARDU Edu desktop application."
                        description="Status shown when hardware tools are opened outside the desktop application"
                    />
                ) : !desktopState.resourcesReady ? (
                    <FormattedMessage
                        id="gui.sardu.resourcesMissing"
                        defaultMessage="Arduino resources are missing. Run the hardware resources batch."
                        description="Status shown when the local Arduino toolchain is incomplete"
                    />
                ) : desktopState.status === 'compiling' ? (
                    <FormattedMessage
                        id="gui.sardu.compiling"
                        defaultMessage="Compiling…"
                        description="Status shown while Arduino code is compiling"
                    />
                ) : desktopState.status === 'compiled' ? (
                    <FormattedMessage
                        id="gui.sardu.compiled"
                        defaultMessage="Compilation completed"
                        description="Status shown after Arduino code compiles successfully"
                    />
                ) : desktopState.status === 'uploading' ? (
                    <FormattedMessage
                        id="gui.sardu.uploading"
                        defaultMessage="Compiling and uploading…"
                        description="Status shown while Arduino code is compiled and uploaded"
                    />
                ) : desktopState.status === 'uploaded' ? (
                    <FormattedMessage
                        id="gui.sardu.uploaded"
                        defaultMessage="Upload completed"
                        description="Status shown after Arduino code uploads successfully"
                    />
                ) : !desktopState.selectedPort || !connectedPort ? (
                    <FormattedMessage
                        id="gui.sardu.boardNotConnected"
                        defaultMessage="Choose a serial port, then use the connection button beside the project name. Arduino blocks and .ino export remain available."
                        description="Status shown until the user explicitly connects the selected Arduino board"
                    />
                ) : snapshot.selection.mode === 'realtime' && liveState.error ? (
                    <FormattedMessage
                        id="gui.sardu.liveError"
                        defaultMessage="Live error: {message}"
                        description="Error shown when live Arduino communication fails"
                        values={{message: liveState.error}}
                    />
                ) : snapshot.selection.mode === 'realtime' && liveState.status === 'connecting' ? (
                    <FormattedMessage
                        id="gui.sardu.liveConnecting"
                        defaultMessage="Connecting…"
                        description="Status shown while connecting a live Arduino board"
                    />
                ) : snapshot.selection.mode === 'realtime' && liveState.status === 'connected' ? (
                    <FormattedMessage
                        id="gui.sardu.liveConnectedScratch"
                        defaultMessage="Connected: hardware blocks now run inside Scratch scripts."
                        description="Status shown when Arduino blocks can run in normal Scratch scripts"
                    />
                ) : snapshot.selection.mode === 'realtime' ? (
                    <FormattedMessage
                        id="gui.sardu.liveFirmwareHint"
                        defaultMessage="Install the Live firmware, then connect the board."
                        description="Instructions shown before connecting an Arduino board in live mode"
                    />
                ) : (
                    <FormattedMessage
                        id="gui.sardu.offlineReady"
                        defaultMessage="Board connected on {port}. Offline code can be compiled or uploaded."
                        description="Status shown when standalone Arduino programming is ready"
                        values={{port: desktopState.selectedPort}}
                    />
                )}
            </div>
            <div className={styles.sourceArea}>
                {sourceError ? (
                    <p className={styles.error}>
                        <FormattedMessage
                            id="gui.sardu.codeError"
                            defaultMessage="The Arduino code cannot be generated: {message}"
                            description="Error shown when blocks cannot be converted to Arduino source"
                            values={{message: sourceError}}
                        />
                    </p>
                ) : (
                    <textarea
                        className={styles.code}
                        readOnly={!sourceEditing}
                        spellCheck={false}
                        value={displayedSource}
                        onChange={event => setManualSource(event.target.value)}
                    />
                )}
                {snapshot.selection.mode === 'standalone' || bottomPanel === 'output' ? (
                    <section className={`${styles.serialMonitor} ${styles.serialMonitorOpen}`}>
                        <div className={styles.serialMonitorHeader}>
                            <div className={styles.bottomPanelTabs}>
                                <button
                                    className={bottomPanel === 'output' ? styles.bottomPanelTabActive : ''}
                                    type="button"
                                    onClick={handleShowOutput}
                                >
                                    <FormattedMessage
                                        id="gui.sardu.output"
                                        defaultMessage="Output"
                                        description="Title of the Arduino compilation and upload output"
                                    />
                                </button>
                                {snapshot.selection.mode === 'standalone' ? (
                                    <button
                                        className={bottomPanel === 'serial' ? styles.bottomPanelTabActive : ''}
                                        type="button"
                                        onClick={handleShowSerial}
                                    >
                                        <FormattedMessage
                                            id="gui.sardu.serialMonitor"
                                            defaultMessage="Serial monitor"
                                            description="Title of the Offline Arduino serial monitor"
                                        />
                                    </button>
                                ) : null}
                            </div>
                            {bottomPanel === 'serial' ? <div className={styles.serialMonitorActions}>
                                <label className={styles.serialMonitorBaud}>
                                    <FormattedMessage
                                        id="gui.sardu.serialMonitorBaud"
                                        defaultMessage="Speed"
                                        description="Label for the Offline serial monitor baud-rate selector"
                                    />
                                    <select
                                        disabled={monitorActive}
                                        value={monitorBaudRate}
                                        onChange={event => setMonitorBaudRate(event.target.value)}
                                    >
                                        {[300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map(baud => (
                                            <option key={baud} value={baud}>{baud}</option>
                                        ))}
                                    </select>
                                </label>
                                <button className={styles.controlButton} onClick={() => setSerialOutput('')}>
                                    <FormattedMessage
                                        id="gui.sardu.serialMonitorClear"
                                        defaultMessage="Clear"
                                        description="Button that clears received serial output"
                                    />
                                </button>
                            </div> : <button className={styles.controlButton} onClick={() => setHardwareOutput('')}>
                                <FormattedMessage
                                    id="gui.sardu.outputClear"
                                    defaultMessage="Clear"
                                    description="Button that clears Arduino output"
                                />
                            </button>}
                        </div>
                        {bottomPanel === 'serial' && monitorState.error ?
                            <div className={styles.serialMonitorError}>{monitorState.error}</div> : null}
                        {bottomPanel === 'serial' ? (
                            <textarea
                                ref={outputRef}
                                className={styles.serialOutput}
                                readOnly
                                spellCheck={false}
                                value={serialOutput}
                                placeholder={monitorActive ? intl.formatMessage({
                                    id: 'gui.sardu.serialMonitorWaiting',
                                    defaultMessage: 'Serial data received from the board will appear here.',
                                    description: 'Placeholder for empty Offline Arduino serial output'
                                }) : ''}
                            />
                        ) : null}
                        {bottomPanel === 'output' ? (
                            <textarea
                                ref={outputRef}
                                className={styles.serialOutput}
                                readOnly
                                spellCheck={false}
                                value={hardwareOutput}
                            />
                        ) : null}
                    </section>
                ) : null}
            </div>
        </section>
        </React.Fragment>
    );
};

ArduinoCodePanel.propTypes = {
    onRequestClose: PropTypes.func.isRequired,
    onStatusChange: PropTypes.func.isRequired,
    projectTitle: PropTypes.string.isRequired,
    isFullScreen: PropTypes.bool,
    stageSize: PropTypes.oneOf(['large', 'largeConstrained', 'small']).isRequired,
    stagePaneWidth: PropTypes.number,
    viewMode: PropTypes.oneOf(['code', 'stage', 'combined']).isRequired,
    visible: PropTypes.bool.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    projectTitle: state.scratchGui.projectTitle
});

export {
    ArduinoCodePanel,
    appendHardwareOutput,
    getArduinoPanelWidth,
    getCompatiblePorts,
    getDisplayedSource,
    getFilename,
    getInitialDesktopState,
    getPreselectedPort,
    getSerialBaudRate
};
export default connect(mapStateToProps)(ArduinoCodePanel);

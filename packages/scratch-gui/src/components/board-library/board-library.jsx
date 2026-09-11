import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import VM from '@scratch/scratch-vm';
import {ARDUINO_BOARDS} from '@sardu-edu/hardware';

import LibraryComponent from '../library/library.jsx';
import unoIcon from './arduino-uno.svg';
import nanoIcon from './arduino-nano.svg';

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
    }
];

const getDigitalOutputPins = boardId => ARDUINO_BOARDS.find(board => board.id === boardId)?.pins
    .filter(pin => pin.capabilities.includes('digital-output')).map(pin => pin.id) || [];
const getAnalogInputPins = boardId => ARDUINO_BOARDS.find(board => board.id === boardId)?.pins
    .filter(pin => pin.capabilities.includes('analog-input')).map(pin => pin.id) || [];
const getPwmPins = boardId => ARDUINO_BOARDS.find(board => board.id === boardId)?.pins
    .filter(pin => pin.capabilities.includes('pwm')).map(pin => pin.id) || [];

const BoardLibrary = ({onRequestClose, vm}) => {
    const intl = useIntl();
    const selection = vm.getSarduEduProjectData()?.hardwareSelection;
    const [selectedBoardName, setSelectedBoardName] = useState(selection?.boardName ||
        BOARD_ITEMS.find(item => item.boardId === selection?.boardId)?.name);
    const handleRemove = () => {
        vm.clearSarduEduHardwareSelection();
        setSelectedBoardName(null);
    };
    const handleSelect = item => {
        const selectBoard = () => {
            vm.setSarduEduHardwareSelection({
                boardId: item.boardId,
                boardName: item.name,
                componentIds: selection?.componentIds || [],
                analogInputPins: getAnalogInputPins(item.boardId),
                hardwareKind: 'board',
                digitalOutputPins: getDigitalOutputPins(item.boardId),
                pwmPins: getPwmPins(item.boardId),
                boardVersion: '1',
                backendId: 'arduino-cpp',
                backendVersion: '1',
                mode: 'standalone'
            });
            vm.setSarduEduHardwarePort(null);
            vm.emit('SARDU_CONNECT_REQUESTED', {afterSelection: true});
            setSelectedBoardName(item.name);
            onRequestClose();
        };
        if (vm.extensionManager.isExtensionLoaded('sarduBoard')) {
            void selectBoard();
        } else {
            void vm.extensionManager.loadExtensionURL('sarduBoard').then(selectBoard);
        }
    };

    return (
        <LibraryComponent
            data={BOARD_ITEMS}
            filterable={false}
            id="boardLibrary"
            title={intl.formatMessage({
                id: 'gui.sardu.boardLibraryTitle',
                defaultMessage: 'Choose a board',
                description: 'Title of the SARDU Edu board library'
            })}
            onItemSelected={handleSelect}
            onItemRemove={handleRemove}
            onRequestClose={onRequestClose}
            removeItemLabel={intl.formatMessage({
                id: 'gui.sardu.removeBoard',
                defaultMessage: 'Remove selected board',
                description: 'Tooltip for removing the selected SARDU Edu board'
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

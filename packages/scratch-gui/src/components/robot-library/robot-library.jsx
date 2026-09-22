import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import VM from '@scratch/scratch-vm';
import {ARDUINO_BOARDS} from '@sardu-block/hardware';

import LibraryComponent from '../library/library.jsx';
import ottoIcon from '../../../../../docs/SVG/otto.svg';

const ROBOT_ITEMS = [{
    boardId: 'arduino-nano', robotId: 'otto-diy', featured: true, name: 'Otto DIY', rawURL: ottoIcon,
    description: <span><FormattedMessage id="gui.sardu.ottoDescription" defaultMessage="Open-source educational robot with four servomotors and an ultrasonic sensor. Board: Arduino Nano." description="Otto DIY robot description including its board" />{' '}<a href="https://www.ottodiy.com/" rel="noreferrer" target="_blank" onClick={event => event.stopPropagation()}>Official site</a></span>
}];

const pinsByCapability = (capability) => ARDUINO_BOARDS.find(board => board.id === 'arduino-nano')?.pins
    .filter(pin => pin.capabilities.includes(capability)).map(pin => pin.id) || [];
const busPins = Object.fromEntries((ARDUINO_BOARDS.find(board => board.id === 'arduino-nano')?.buses || [])
    .map(bus => [bus.type, {...bus.signals}]));

const RobotLibrary = ({onRequestClose, vm}) => {
    const intl = useIntl();
    const selection = vm.getSarduBlockProjectData()?.hardwareSelection;
    return (
        <LibraryComponent
            data={ROBOT_ITEMS}
            emptyMessage={(
                <FormattedMessage
                    id="gui.sardu.noRobots"
                    defaultMessage="No robot profiles are available yet."
                    description="Message shown while the SARDU-Block robot library is empty"
                />
            )}
            filterable={false}
            id="robotLibrary"
            title={intl.formatMessage({
                id: 'gui.sardu.robotLibraryTitle',
                defaultMessage: 'Choose a robot',
                description: 'Title of the SARDU-Block robot library'
            })}
            onItemSelected={item => {
                vm.setSarduBlockHardwareSelection({
                    boardId: item.boardId, boardName: 'Arduino Nano', robotId: item.robotId, hardwareKind: 'robot',
                    componentIds: ['servo', 'hc-sr04', 'touch', 'sound-sensor', 'photoresistor', 'buzzer'],
                    analogInputPins: pinsByCapability('analog-input'),
                    busPins,
                    digitalOutputPins: pinsByCapability('digital-output'),
                    pwmPins: pinsByCapability('pwm'), boardVersion: '1', backendId: 'arduino-cpp',
                    backendVersion: '1', mode: 'standalone'
                });
                vm.setSarduBlockHardwarePort(null);
                const close = () => {
                    vm.emit('SARDU_BLOCK_CONNECT_REQUESTED', {afterSelection: true});
                    onRequestClose();
                };
                if (vm.extensionManager.isExtensionLoaded('sarduBoard')) {
                    void vm.extensionManager.refreshBlocks().then(close);
                } else {
                    void vm.extensionManager.loadExtensionURL('sarduBoard').then(close);
                }
            }}
            onItemRemove={() => vm.clearSarduEduHardwareSelection()}
            onRequestClose={onRequestClose}
            removeItemLabel={intl.formatMessage({
                id: 'gui.sardu.removeRobot',
                defaultMessage: 'Remove selected robot',
                description: 'Tooltip for removing the selected SARDU-Block robot'
            })}
            selectedItemId={selection?.hardwareKind === 'robot' ?
                ROBOT_ITEMS.find(item => item.robotId === selection.robotId)?.name : null}
        />
    );
};

RobotLibrary.propTypes = {
    onRequestClose: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default RobotLibrary;

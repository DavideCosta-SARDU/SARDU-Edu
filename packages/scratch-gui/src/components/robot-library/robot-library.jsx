import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import VM from '@scratch/scratch-vm';

import LibraryComponent from '../library/library.jsx';

const ROBOT_ITEMS = [];

const RobotLibrary = ({onRequestClose, vm}) => {
    const intl = useIntl();
    const selection = vm.getSarduEduProjectData()?.hardwareSelection;
    return (
        <LibraryComponent
            data={ROBOT_ITEMS}
            emptyMessage={(
                <FormattedMessage
                    id="gui.sardu.noRobots"
                    defaultMessage="No robot profiles are available yet."
                    description="Message shown while the SARDU Edu robot library is empty"
                />
            )}
            filterable={false}
            id="robotLibrary"
            title={intl.formatMessage({
                id: 'gui.sardu.robotLibraryTitle',
                defaultMessage: 'Choose a robot',
                description: 'Title of the SARDU Edu robot library'
            })}
            onItemRemove={() => vm.clearSarduEduHardwareSelection()}
            onRequestClose={onRequestClose}
            removeItemLabel={intl.formatMessage({
                id: 'gui.sardu.removeRobot',
                defaultMessage: 'Remove selected robot',
                description: 'Tooltip for removing the selected SARDU Edu robot'
            })}
            selectedItemId={selection?.hardwareKind === 'robot' ? selection.boardName : null}
        />
    );
};

RobotLibrary.propTypes = {
    onRequestClose: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default RobotLibrary;

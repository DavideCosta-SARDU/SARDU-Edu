import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import VM from '@scratch/scratch-vm';

import LibraryComponent from '../library/library.jsx';
import dhtIcon from './dht.svg';

const COMPONENT_ITEMS = [{
    componentId: 'dht11-dht22',
    featured: true,
    name: 'DHT11/DHT22',
    rawURL: dhtIcon,
    description: <span>
        <FormattedMessage
            id="gui.sardu.dhtDescription"
            defaultMessage="Digital sensor that measures temperature and humidity. The library also supports other DHT models."
            description="Description of DHT11 and DHT22 in the component library"
        />{' '}
        <a
            href="https://github.com/adafruit/DHT-sensor-library"
            rel="noreferrer"
            target="_blank"
            onClick={event => event.stopPropagation()}
        >
            <FormattedMessage
                id="gui.sardu.dhtLibraryLink"
                defaultMessage="Library page"
                description="Link to the official DHT Arduino library"
            />
        </a>
    </span>
}];

const ComponentLibrary = ({onRequestClose, vm}) => {
    const intl = useIntl();
    const selection = vm.getSarduEduProjectData()?.hardwareSelection;
    const selectedIds = selection?.componentIds || [];
    const updateSelection = componentIds => {
        if (!selection) return;
        vm.setSarduEduHardwareSelection({...selection, componentIds});
    };
    return (
        <LibraryComponent
            data={COMPONENT_ITEMS}
            filterable={false}
            id="componentLibrary"
            title={intl.formatMessage({
                id: 'gui.sardu.componentLibraryTitle',
                defaultMessage: 'Choose sensors and actuators',
                description: 'Title of the SARDU Edu component library'
            })}
            onItemSelected={item => {
                updateSelection(Array.from(new Set([...selectedIds, item.componentId])));
                onRequestClose();
            }}
            onItemRemove={item => updateSelection(selectedIds.filter(id => id !== item.componentId))}
            onRequestClose={onRequestClose}
            removeItemLabel={intl.formatMessage({
                id: 'gui.sardu.removeComponent',
                defaultMessage: 'Remove selected sensor or actuator',
                description: 'Tooltip for removing a selected SARDU Edu component'
            })}
            selectedItemId={selectedIds.includes('dht11-dht22') ? 'DHT11/DHT22' : null}
        />
    );
};

ComponentLibrary.propTypes = {
    onRequestClose: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default ComponentLibrary;

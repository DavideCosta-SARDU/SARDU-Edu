import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import VM from '@scratch/scratch-vm';

import LibraryComponent from '../library/library.jsx';
import dhtIcon from './dht.svg';
import hcSr04Icon from './hc-sr04.svg';
import servoIcon from '../../../../../docs/SVG/ServoMotore.svg';
import laserIcon from '../../../../../docs/SVG/vl53l0x.svg';
import neoPixelIcon from '../../../../../docs/SVG/neopixel-stick-8.svg';
import touchIcon from '../../../../../docs/SVG/touch.svg';
import soundIcon from '../../../../../docs/SVG/SensoreSuono.svg';
import photoresistorIcon from '../../../../../docs/SVG/photoresistore.svg';
import buzzerIcon from '../../../../../docs/SVG/buzzer.svg';
import ledIcon from '../../../../../docs/SVG/led.svg';
import pn532Icon from '../../../../../docs/SVG/Schede/nfc_04.svg';
import rc522Icon from '../../../../../docs/SVG/rfid_rc522.svg';
import styles from './component-library.css';

const summary = (description, categories, connection, maintainer, version, url) => <div>
    <div>{description}</div>
    <dl className={styles.componentMetadata}>
        <dt><FormattedMessage id="gui.sardu.componentCategories" defaultMessage="Categories" description="Component categories label" /></dt><dd>{categories}</dd>
        <dt><FormattedMessage id="gui.sardu.componentConnection" defaultMessage="Connection" description="Component connection label" /></dt><dd>{connection}</dd>
        <dt><FormattedMessage id="gui.sardu.componentMaintainer" defaultMessage="Code maintainer" description="Component code maintainer label" /></dt><dd>{maintainer}</dd>
        <dt><FormattedMessage id="gui.sardu.componentVersion" defaultMessage="Library version" description="Component library version label" /></dt><dd>{version}</dd>
    </dl>
    <a href={url} rel="noreferrer" target="_blank" onClick={event => event.stopPropagation()}>
        <FormattedMessage id="gui.sardu.componentReference" defaultMessage="Manufacturer or technical reference" description="Component reference link" />
    </a>
</div>;

const COMPONENT_ITEMS = [{
    category: 'sensors',
    componentId: 'dht11-dht22',
    featured: true,
    name: 'DHT11/DHT22',
    rawURL: dhtIcon,
    tags: ['temperature', 'temperatura', 'humidity', 'umidità', 'digital', 'digitale'],
    description: summary(<FormattedMessage
        id="gui.sardu.dhtDescription"
        defaultMessage="Digital sensor that measures temperature and humidity. The library also supports other DHT models."
        description="Description of DHT11 and DHT22 in the component library"
    />, 'Temperature; humidity', 'Digital', 'Adafruit', 'DHT sensor library 1.4.7', 'https://github.com/adafruit/DHT-sensor-library')
}, {
    category: 'sensors',
    componentId: 'hc-sr04',
    featured: true,
    name: 'HC-SR04',
    rawURL: hcSr04Icon,
    tags: ['distance', 'distanza', 'digital', 'digitale'], description: summary(<span><FormattedMessage
        id="gui.sardu.hcSr04Description"
        defaultMessage="Ultrasonic sensor that measures distance using separate trigger and echo pins."
        description="Description of HC-SR04 in the component library"
    /></span>, 'Distance', 'Digital', 'Erick Simões', 'Ultrasonic 3.0.0', 'https://github.com/ErickSimoes/Ultrasonic')
}, {
    category: 'sensors', componentId: 'touch', featured: true, name: 'Touch', rawURL: touchIcon,
    tags: ['touch', 'tocco', 'digital', 'digitale'], description: summary(<FormattedMessage id="gui.sardu.touchDescription" defaultMessage="Digital touch sensor. It detects HIGH or LOW on a selectable input pin." description="Touch sensor description" />, 'Touch', 'Digital', 'Davide Costa', 'No external library', 'https://docs.arduino.cc/built-in-examples/digital/Button/')
}, {
    category: 'sensors', componentId: 'sound-sensor', featured: true, name: 'Sound sensor', rawURL: soundIcon,
    tags: ['sound', 'rumore', 'microphone', 'microfono', 'analog', 'analogico'], description: summary(<FormattedMessage id="gui.sardu.soundSensorDescription" defaultMessage="Analog microphone module. It reports the sound level as a raw value or percentage." description="Sound sensor description" />, 'Sound; microphone', 'Analog', 'Davide Costa', 'No external library', 'https://docs.arduino.cc/built-in-examples/basics/AnalogReadSerial/')
}, {
    category: 'sensors', componentId: 'photoresistor', featured: true, name: 'Photoresistor', rawURL: photoresistorIcon,
    tags: ['light', 'luce', 'photoresistor', 'fotoresistore', 'analog', 'analogico'], description: summary(<FormattedMessage id="gui.sardu.photoresistorDescription" defaultMessage="Analog light sensor. It reports the raw reading or brightness percentage." description="Photoresistor description" />, 'Light; photoresistor', 'Analog', 'Davide Costa', 'No external library', 'https://docs.arduino.cc/built-in-examples/basics/AnalogReadSerial/')
}, {
    category: 'sensors', componentId: 'vl53l0x', featured: true, name: 'VL53L0X', rawURL: laserIcon,
    tags: ['laser', 'distance', 'distanza', 'i2c'], description: summary(<FormattedMessage id="gui.sardu.vl53l0xDescription" defaultMessage="Laser time-of-flight distance sensor connected through I2C." description="VL53L0X description" />, 'Distance; laser', 'I2C (SDA/SCL)', 'Pololu', 'VL53L0X 1.3.1', 'https://www.pololu.com/product/2490')
}, {
    category: 'sensors', componentId: 'pn532', featured: true, name: 'PN532', rawURL: pn532Icon,
    tags: ['nfc', 'rfid', 'tag', 'i2c', 'spi'], description: summary(<FormattedMessage
        id="gui.sardu.pn532Description"
        defaultMessage="NFC/RFID reader and writer with selectable I2C or SPI connection."
        description="PN532 module description"
    />, 'RFID; NFC', 'I2C or SPI', 'Adafruit', 'Adafruit PN532 1.3.4', 'https://github.com/adafruit/Adafruit-PN532')
}, {
    category: 'sensors', componentId: 'rc522', featured: true, name: 'RC522', rawURL: rc522Icon,
    tags: ['rfid', 'tag', 'mifare', 'spi'], description: summary(<FormattedMessage
        id="gui.sardu.rc522Description"
        defaultMessage="RFID reader and writer for ISO/IEC 14443A and MIFARE tags over SPI."
        description="RC522 module description"
    />, 'RFID', 'SPI (MOSI/MISO/SCK/CS)', 'miguelbalboa', 'MFRC522 1.4.12', 'https://github.com/miguelbalboa/rfid')
}, {
    category: 'actuators',
    componentId: 'servo',
    featured: true,
    name: 'Servomotor',
    rawURL: servoIcon,
    tags: ['servo', 'servomotor', 'servomotore', 'digital', 'digitale'], description: summary(<span><FormattedMessage
        id="gui.sardu.servoDescription"
        defaultMessage="Position-controlled servomotor. Each selected pin uses an independent servo instance."
        description="Description of a servomotor in the component library"
    /></span>, 'Servomotor', 'Digital / PWM control signal', 'Arduino', 'Servo 1.3.0', 'https://docs.arduino.cc/libraries/servo/')
}, {
    category: 'actuators', componentId: 'buzzer', featured: true, name: 'Buzzer', rawURL: buzzerIcon,
    tags: ['buzzer', 'sound', 'suono', 'digital', 'digitale'], description: summary(<FormattedMessage id="gui.sardu.buzzerDescription" defaultMessage="Piezoelectric buzzer for tones, beeps and melodies." description="Buzzer description" />, 'Sound; buzzer', 'Digital', 'Davide Costa', 'No external library', 'https://docs.arduino.cc/built-in-examples/digital/toneMelody/')
}, {
    category: 'actuators', componentId: 'led', featured: true, name: 'LED', rawURL: ledIcon,
    tags: ['led', 'light', 'luce', 'digital', 'digitale', 'pwm'], description: summary(<FormattedMessage
        id="gui.sardu.ledDescription"
        defaultMessage="Standard light-emitting diode controlled digitally or with PWM brightness."
        description="Standard LED description"
    />, 'Light; LED', 'Digital / PWM', 'Davide Costa', 'No external library', 'https://docs.arduino.cc/built-in-examples/basics/Fade/')
}, {
    category: 'actuators', componentId: 'neopixel', featured: true, name: 'NeoPixel', rawURL: neoPixelIcon,
    tags: ['led', 'rgb', 'neopixel', 'digital', 'digitale'], description: summary(<FormattedMessage id="gui.sardu.neoPixelDescription" defaultMessage="Individually addressable RGB LED pixels and strips." description="NeoPixel description" />, 'Light; RGB LED', 'Digital, single wire', 'Adafruit', 'Adafruit NeoPixel 1.15.5', 'https://www.adafruit.com/category/168')
}];

const CATEGORY_MESSAGES = {
    sensors: {
        id: 'gui.sardu.sensorsSection',
        defaultMessage: 'Sensors',
        description: 'Sensors section in the component library'
    },
    actuators: {
        id: 'gui.sardu.actuatorsSection',
        defaultMessage: 'Actuators',
        description: 'Actuators section in the component library'
    }
};

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
            categoryMessages={CATEGORY_MESSAGES}
            categoryOrder={['sensors', 'actuators']}
            categoryClassName={styles.componentSection}
            filterable
            hardwareThumbnails
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
            selectedItemIds={COMPONENT_ITEMS.filter(item => selectedIds.includes(item.componentId))
                .map(item => item.name)}
            withCategories
        />
    );
};

ComponentLibrary.propTypes = {
    onRequestClose: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default ComponentLibrary;

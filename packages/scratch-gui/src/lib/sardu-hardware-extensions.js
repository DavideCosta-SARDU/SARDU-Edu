export const SARDU_BLOCK_SENSOR_COMPONENT_IDS = [
    'dht11-dht22', 'hc-sr04', 'touch', 'button', 'sound-sensor', 'photoresistor', 'vl53l0x', 'pn532', 'rc522'
];

export const selectionNeedsSarduSensors = selection =>
    Boolean(selection?.componentIds?.some(id => SARDU_BLOCK_SENSOR_COMPONENT_IDS.includes(id)));

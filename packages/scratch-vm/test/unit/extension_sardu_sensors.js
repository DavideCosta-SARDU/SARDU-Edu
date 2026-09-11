const test = require('tap').test;
const SarduSensors = require('../../src/extensions/scratch3_sardu_sensors');

test('SARDU sensors exposes DHT11/DHT22 blocks only when the component is selected Offline', t => {
    const extension = new SarduSensors({sarduEdu: {hardwareSelection: {
        componentIds: ['dht11-dht22'],
        digitalOutputPins: ['2', '13'],
        mode: 'standalone'
    }}});
    const info = extension.getInfo();
    const blocks = Object.fromEntries(info.blocks.map(block => [block.opcode, block]));

    t.equal(info.id, 'sarduSensors');
    t.equal(blocks.dhtTemperature.hideFromPalette, false);
    t.equal(blocks.dhtHumidity.hideFromPalette, false);
    t.same(info.menus.DHT_MODEL.items, ['DHT11', 'DHT22']);
    t.ok(info.blocks.every(block => block.tooltip));
    t.end();
});

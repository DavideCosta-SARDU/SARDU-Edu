/* eslint-env jest */
import {selectionNeedsSarduSensors} from '../../../src/lib/sardu-hardware-extensions';

test('selecting the push button loads the SARDU-Block sensors extension', () => {
    expect(selectionNeedsSarduSensors({componentIds: ['button']})).toBe(true);
    expect(selectionNeedsSarduSensors({componentIds: []})).toBe(false);
    expect(selectionNeedsSarduSensors(null)).toBe(false);
});

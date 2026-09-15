/* eslint-env jest */
import {
    PANEL_MARGIN,
    getDraggedPanelPosition
} from '../../../src/lib/sardu-panel-position';

const drag = overrides => getDraggedPanelPosition({
    dragOffsetX: 40,
    dragOffsetY: 20,
    panelHeight: 200,
    panelWidth: 300,
    parentHeight: 600,
    parentWidth: 900,
    pointerX: 340,
    pointerY: 220,
    ...overrides
});

test('keeps a dragged Arduino panel inside its parent', () => {
    expect(drag({pointerX: -100, pointerY: -100})).toEqual({
        dockedRight: false,
        left: PANEL_MARGIN,
        top: PANEL_MARGIN
    });
});

test('snaps the Arduino panel to the right edge when it is close', () => {
    expect(drag({pointerX: 620})).toEqual({
        dockedRight: true,
        left: 600,
        top: 200
    });
});

test('uses the entire editor width when calculating the right dock', () => {
    expect(drag({parentWidth: 1400, pointerX: 1150})).toEqual({
        dockedRight: true,
        left: 1100,
        top: 200
    });
});

test('leaves the Arduino panel free when it is away from the right edge', () => {
    expect(drag({pointerX: 400})).toEqual({
        dockedRight: false,
        left: 360,
        top: 200
    });
});

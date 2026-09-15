const PANEL_MARGIN = 12;
const RIGHT_SNAP_DISTANCE = 56;

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

const getDraggedPanelPosition = ({
    dragOffsetX,
    dragOffsetY,
    panelHeight,
    panelWidth,
    parentHeight,
    parentWidth,
    pointerX,
    pointerY
}) => {
    const maximumLeft = Math.max(PANEL_MARGIN, parentWidth - panelWidth);
    const maximumTop = Math.max(PANEL_MARGIN, parentHeight - panelHeight - PANEL_MARGIN);
    const left = clamp(pointerX - dragOffsetX, PANEL_MARGIN, maximumLeft);
    const dockedRight = maximumLeft - left <= RIGHT_SNAP_DISTANCE;

    return {
        dockedRight,
        left: dockedRight ? maximumLeft : left,
        top: clamp(pointerY - dragOffsetY, PANEL_MARGIN, maximumTop)
    };
};

export {
    PANEL_MARGIN,
    RIGHT_SNAP_DISTANCE,
    getDraggedPanelPosition
};

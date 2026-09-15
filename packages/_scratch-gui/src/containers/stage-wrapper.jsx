import PropTypes from 'prop-types';
import React from 'react';
import VM from '@scratch/scratch-vm';
import {STAGE_DISPLAY_SIZES} from '../lib/layout-constants.js';
import StageWrapperComponent from '../components/stage-wrapper/stage-wrapper.jsx';

const StageWrapper = props => <StageWrapperComponent {...props} />;

StageWrapper.propTypes = {
    ariaLabel: PropTypes.string,
    ariaRole: PropTypes.string,
    isRendererSupported: PropTypes.bool.isRequired,
    onSarduViewModeChange: PropTypes.func,
    sarduMode: PropTypes.oneOf(['standalone', 'realtime']),
    sarduViewMode: PropTypes.oneOf(['code', 'stage', 'combined']),
    showStage: PropTypes.bool,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default StageWrapper;

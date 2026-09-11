import PropTypes from 'prop-types';
import React, {useCallback, useContext} from 'react';
import {useIntl} from 'react-intl';

import {ModalFocusContext} from '../../contexts/modal-focus-context.jsx';
import boardIcon from './icon--board.svg';
import componentIcon from './icon--components.svg';
import robotIcon from './icon--robot.svg';
import styles from './hardware-buttons.css';

const HardwareButtons = ({onBoardClick, onComponentClick, onRobotClick}) => {
    const intl = useIntl();
    const {captureFocus} = useContext(ModalFocusContext);
    const open = useCallback(handler => {
        captureFocus();
        handler();
    }, [captureFocus]);

    return (
        <div className={styles.container}>
            <button
                className={styles.button}
                aria-label={intl.formatMessage({id: 'gui.sardu.boardButton', defaultMessage: 'Boards'})}
                title={intl.formatMessage({id: 'gui.sardu.boardButton', defaultMessage: 'Boards'})}
                onClick={() => open(onBoardClick)}
            >
                <img alt="" className={styles.icon} src={boardIcon} draggable={false} />
            </button>
            <button
                className={styles.button}
                aria-label={intl.formatMessage({
                    id: 'gui.sardu.componentButton',
                    defaultMessage: 'Sensors and actuators'
                })}
                title={intl.formatMessage({
                    id: 'gui.sardu.componentButton',
                    defaultMessage: 'Sensors and actuators'
                })}
                onClick={() => open(onComponentClick)}
            >
                <img alt="" className={styles.icon} src={componentIcon} draggable={false} />
            </button>
            <button
                className={styles.button}
                aria-label={intl.formatMessage({id: 'gui.sardu.robotButton', defaultMessage: 'Robots'})}
                title={intl.formatMessage({id: 'gui.sardu.robotButton', defaultMessage: 'Robots'})}
                onClick={() => open(onRobotClick)}
            >
                <img alt="" className={styles.icon} src={robotIcon} draggable={false} />
            </button>
        </div>
    );
};

HardwareButtons.propTypes = {
    onBoardClick: PropTypes.func.isRequired,
    onComponentClick: PropTypes.func.isRequired,
    onRobotClick: PropTypes.func.isRequired
};

export default HardwareButtons;

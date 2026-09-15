import React, {useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {FormattedMessage, useIntl, defineMessage} from 'react-intl';
import {connect} from 'react-redux';
import ReactModal from 'react-modal';

import MenuBarMenu from './menu-bar-menu.jsx';
import Button from '../button/button.jsx';
import {MenuItem} from '../menu/menu.jsx';
import useMenuNavigation from '../../hooks/use-menu-navigation';

import stylesMenuBar from './menu-bar.css';
import stylesAboutMenu from './about-menu.css';
import aboutIcon from './icon--about.svg';

const aboutMenuMessage = defineMessage({
    id: 'gui.aria.aboutMenu',
    defaultMessage: 'About menu',
    description: 'accessibility label for About menu'
});

const AboutButton = props => {
    const intl = useIntl();

    return (<Button
        className={classNames(stylesMenuBar.menuBarItem, stylesMenuBar.hoverable)}
        iconClassName={stylesAboutMenu.aboutIcon}
        iconSrc={aboutIcon}
        onClick={props.onClick}
        aria-label={intl.formatMessage(aboutMenuMessage)}
    />);
};

AboutButton.propTypes = {
    onClick: PropTypes.func.isRequired
};

const AboutMenu = ({
    onClick,
    isRtl,
    depth
}) => {
    const intl = useIntl();
    const [legalPage, setLegalPage] = useState(null);
    if (typeof onClick === 'function') {
        // make a button which calls a function
        return <AboutButton onClick={onClick} />;
    }

    // assume it's an array of objects
    // each item must have a 'title' FormattedMessage and a 'handleClick' function
    // generate a menu with items for each object in the array

    const {
        menuRef,
        isExpanded,
        handleOnOpen,
        handleOnClose,
        handleKeyDown,
        handleKeyDownOpenMenu
    } = useMenuNavigation({
        depth,
        isRtl
    });

    const wrapAboutMenuCallback = useCallback(
        callback => () => {
            callback();
            handleOnClose();
        },
        [handleOnClose]
    );
    const menuItems = Array.isArray(onClick) ? onClick : [{
        title: intl.formatMessage({id: 'gui.about.sarduEdu', defaultMessage: 'About SARDU Edu'}),
        onClick: () => setLegalPage('sardu')
    }, {
        title: intl.formatMessage({id: 'gui.about.thirdParty', defaultMessage: 'Third-party licenses'}),
        onClick: () => setLegalPage('third-party')
    }];

    return (
        <React.Fragment><button
            className={classNames(stylesMenuBar.menuBarItem, stylesMenuBar.hoverable, {
                [stylesMenuBar.active]: isExpanded()
            })}
            onClick={handleOnOpen}
            onKeyDown={handleKeyDown}
            aria-label={intl.formatMessage(aboutMenuMessage)}
            aria-expanded={isExpanded()}
            ref={menuRef}
        >
            <img
                className={stylesAboutMenu.aboutIcon}
                src={aboutIcon}
            />
            <MenuBarMenu
                className={classNames(stylesMenuBar.menuBarMenu)}
                open={isExpanded()}
                place={isRtl ? 'right' : 'left'}
                onRequestClose={handleOnClose}
            >
                {
                    menuItems.map(itemProps => (
                        <MenuItem
                            key={itemProps.title}
                            onClick={wrapAboutMenuCallback(itemProps.onClick)}
                            onParentKeyDown={handleKeyDownOpenMenu}
                            isDataMenuItem
                        >
                            {itemProps.title}
                        </MenuItem>
                    ))
                }
            </MenuBarMenu>
        </button>
        <ReactModal
            isOpen={Boolean(legalPage)}
            className={stylesAboutMenu.legalModal}
            overlayClassName={stylesAboutMenu.legalOverlay}
            onRequestClose={() => setLegalPage(null)}
        >
            <button className={stylesAboutMenu.closeButton} type="button" onClick={() => setLegalPage(null)}>×</button>
            {legalPage === 'sardu' ? <div className={stylesAboutMenu.legalContent}>
                <h2>SARDU Edu</h2>
                <p>Copyright (C) 2026 Davide Costa — SARDU</p>
                <p><a href="mailto:davide@sardu.pro">davide@sardu.pro</a></p>
                <p><FormattedMessage id="gui.about.agplExplanation" defaultMessage="The original SARDU Edu code is free software under GNU AGPL v3. You may use, study, modify and redistribute it under that license. If you distribute a modified version, or make it available to users over a network, you must provide the corresponding source code under the same license." /></p>
                <p><FormattedMessage id="gui.about.noWarranty" defaultMessage="The software is provided without warranty. Third-party components retain their own licenses." /></p>
                <p><a href="legal/LICENSE" target="_blank" rel="noreferrer"><FormattedMessage id="gui.about.fullLicense" defaultMessage="Open the complete AGPL-3.0 license" /></a></p>
                <p><FormattedMessage id="gui.about.evSignature" defaultMessage="Official executables are intended to be digitally signed with an EV code-signing certificate so users can verify their origin and integrity." /></p>
            </div> : null}
            {legalPage === 'third-party' ? <div className={stylesAboutMenu.legalContent}>
                <h2><FormattedMessage id="gui.about.thirdParty" defaultMessage="Third-party licenses" /></h2>
                <p><FormattedMessage id="gui.about.thirdPartyExplanation" defaultMessage="SARDU Edu uses third-party software whose original copyright notices and licenses remain applicable and are not replaced by the SARDU Edu license." /></p>
                <iframe className={stylesAboutMenu.licenseFrame} title="Third-party licenses" src="legal/THIRD-PARTY-LICENSES" />
            </div> : null}
        </ReactModal></React.Fragment>
    );
};

AboutMenu.propTypes = {
    isRtl: PropTypes.bool,
    onClick: PropTypes.oneOfType([
        PropTypes.func, // button mode: call this callback when the About button is clicked
        PropTypes.arrayOf( // menu mode: list of items in the About menu
            PropTypes.shape({
                title: PropTypes.string, // text for the menu item
                onClick: PropTypes.func // call this callback when the menu item is clicked
            })
        )
    ]),
    depth: PropTypes.number
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

export default connect(mapStateToProps)(AboutMenu);

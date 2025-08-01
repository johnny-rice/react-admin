import React, {
    forwardRef,
    useCallback,
    useRef,
    type ReactElement,
    type ReactNode,
} from 'react';
import {
    type ComponentsOverrides,
    styled,
    useThemeProps,
} from '@mui/material/styles';
import clsx from 'clsx';
import { Link, type LinkProps, useMatch } from 'react-router-dom';
import {
    MenuItem,
    type MenuItemProps,
    ListItemIcon,
    Tooltip,
    type TooltipProps,
    useMediaQuery,
    Theme,
    useForkRef,
    Typography,
} from '@mui/material';
import { useTranslate, useBasename, useEvent } from 'ra-core';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSidebarState } from './useSidebarState';
import { KeyboardShortcut } from '../KeyboardShortcut';

/**
 * Displays a menu item with a label and an icon - or only the icon with a tooltip when the sidebar is minimized.
 * It also handles the automatic closing of the menu on tap on mobile.
 *
 * @typedef {Object} Props the props you can use
 * @prop {string|Location} to The menu item's target. It is passed to a React Router NavLink component.
 * @prop {string|ReactNode} primaryText The menu content, displayed when the menu isn't minimized. |
 * @prop {ReactNode} leftIcon The menu icon
 *
 * Additional props are passed down to the underling Material UI <MenuItem> component
 * @see https://material-ui.com/api/menu-item/#menuitem-api
 *
 * @example // You can create a custom menu component using the <DashboardMenuItem> and <MenuItemLink> components:
 *
 * // in src/Menu.js
 * import * as React from 'react';
 * import { DashboardMenuItem, MenuItemLink } from 'react-admin';
 * import BookIcon from '@mui/icons-material/Book';
 * import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
 * import PeopleIcon from '@mui/icons-material/People';
 * import LabelIcon from '@mui/icons-material/Label';
 *
 * export const Menu = () => (
 *     <div>
 *         <DashboardMenuItem />
 *         <MenuItemLink to="/posts" primaryText="Posts" leftIcon={<BookIcon />}/>
 *         <MenuItemLink to="/comments" primaryText="Comments" leftIcon={<ChatBubbleIcon />}/>
 *         <MenuItemLink to="/users" primaryText="Users" leftIcon={<PeopleIcon />}/>
 *         <MenuItemLink to="/custom-route" primaryText="Miscellaneous" leftIcon={<LabelIcon />}/>
 *     </div>
 * );
 *
 * // to use this custom menu component, pass it to a custom Layout:
 * // in src/Layout.js
 * import { Layout } from 'react-admin';
 * import { Menu } from './Menu';
 *
 * export const Layout = ({ children }) => (
 *     <Layout menu={Menu}>
 *         {children}
 *     </Layout>
 * );
 *
 * // then, use this layout in the <Admin layout> prop:
 * // in src/App.js
 * import { Layout }  from './Layout';
 *
 * const App = () => (
 *     <Admin layout={Layout} dataProvider={simpleRestProvider('http://path.to.my.api')}>
 *         // ...
 *     </Admin>
 * );
 */
export const MenuItemLink = forwardRef<any, MenuItemLinkProps>(
    (inProps, ref) => {
        const props = useThemeProps({
            props: inProps,
            name: PREFIX,
        });
        const {
            className,
            primaryText,
            leftIcon,
            onClick,
            sidebarIsOpen,
            tooltipProps,
            children,
            keyboardShortcut,
            keyboardShortcutRepresentation,
            ...rest
        } = props;

        const isSmall = useMediaQuery<Theme>(theme =>
            theme.breakpoints.down('md')
        );
        const translate = useTranslate();
        const basename = useBasename();

        const [open, setOpen] = useSidebarState();
        const handleMenuTap = useCallback(
            e => {
                if (isSmall) {
                    setOpen(false);
                }
                onClick && onClick(e);
            },
            [setOpen, isSmall, onClick]
        );

        const to =
            (typeof props.to === 'string' ? props.to : props.to.pathname) || '';
        const match = useMatch({ path: to, end: to === `${basename}/` });

        const itemRef = useRef<HTMLLIElement>(null);
        // Use a forked ref allows us to have a ref locally without losing the one passed by users
        const forkedRef = useForkRef(itemRef, ref);

        const handleShortcut = useEvent(() => itemRef.current?.click());
        useHotkeys(keyboardShortcut ?? [], handleShortcut, {
            enabled: keyboardShortcut != null,
        });

        const renderMenuItem = () => {
            return (
                <StyledMenuItem
                    className={clsx(className, MenuItemLinkClasses.root, {
                        [MenuItemLinkClasses.active]: !!match,
                    })}
                    // @ts-ignore
                    component={LinkRef}
                    ref={forkedRef}
                    tabIndex={0}
                    {...rest}
                    onClick={handleMenuTap}
                >
                    {leftIcon && (
                        <ListItemIcon className={MenuItemLinkClasses.icon}>
                            {leftIcon}
                        </ListItemIcon>
                    )}
                    <Typography variant="inherit" noWrap sx={{ flexGrow: 1 }}>
                        {children
                            ? children
                            : typeof primaryText === 'string'
                              ? translate(primaryText, {
                                    _: primaryText,
                                })
                              : primaryText}
                    </Typography>
                    {keyboardShortcut
                        ? keyboardShortcutRepresentation ?? (
                              <KeyboardShortcut
                                  className={MenuItemLinkClasses.shortcut}
                                  keyboardShortcut={keyboardShortcut}
                              />
                          )
                        : null}
                </StyledMenuItem>
            );
        };

        if (open) {
            return renderMenuItem();
        }

        return (
            <Tooltip
                title={
                    typeof primaryText === 'string'
                        ? translate(primaryText, { _: primaryText })
                        : primaryText
                }
                placement="right"
                {...tooltipProps}
            >
                {renderMenuItem()}
            </Tooltip>
        );
    }
);

export type MenuItemLinkProps = Omit<
    LinkProps & MenuItemProps<'li'>,
    'placeholder' | 'onPointerEnterCapture' | 'onPointerLeaveCapture'
> & {
    leftIcon?: ReactElement;
    primaryText?: ReactNode;
    /**
     * @deprecated
     */
    sidebarIsOpen?: boolean;
    tooltipProps?: TooltipProps;
    keyboardShortcut?: string;
    keyboardShortcutRepresentation?: ReactNode;
};

const PREFIX = 'RaMenuItemLink';

export const MenuItemLinkClasses = {
    root: `${PREFIX}-root`,
    active: `${PREFIX}-active`,
    icon: `${PREFIX}-icon`,
    shortcut: `${PREFIX}-shortcut`,
};

const StyledMenuItem = styled(MenuItem, {
    name: PREFIX,
    overridesResolver: (props, styles) => styles.root,
})(({ theme }) => ({
    color: (theme.vars || theme).palette.text.secondary,

    [`& .${MenuItemLinkClasses.icon}`]: {
        color: (theme.vars || theme).palette.text.secondary,
    },

    [`& .${MenuItemLinkClasses.shortcut}`]: {
        color: (theme.vars || theme).palette.text.secondary,
        fontSize: theme.typography.body2.fontSize,
        opacity: 0,
        display: 'none',
        transition: 'opacity 0.3s',
    },

    [`&:hover .${MenuItemLinkClasses.shortcut}`]: {
        opacity: 0.7,
        display: 'inline-flex',
    },

    [`&.${MenuItemLinkClasses.active}`]: {
        color: (theme.vars || theme).palette.text.primary,
    },

    [`& .${MenuItemLinkClasses.icon}`]: { minWidth: theme.spacing(5) },
    [`.MuiList-dense > & > .${MenuItemLinkClasses.icon}`]: {
        minWidth: theme.spacing(3.5),
    },
}));

const LinkRef = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => (
    <Link ref={ref} {...props} />
));

declare module '@mui/material/styles' {
    interface ComponentNameToClassKey {
        [PREFIX]: 'root' | 'active' | 'icon' | 'shortcut';
    }

    interface ComponentsPropsList {
        [PREFIX]: Partial<MenuItemLinkProps>;
    }

    interface Components {
        [PREFIX]?: {
            defaultProps?: ComponentsPropsList[typeof PREFIX];
            styleOverrides?: ComponentsOverrides<
                Omit<Theme, 'components'>
            >[typeof PREFIX];
        };
    }
}

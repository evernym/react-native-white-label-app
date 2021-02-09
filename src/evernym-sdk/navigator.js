// @flow

/*
 * Here is you can customize Navigation menu
 * */

// options to be shown on navigation menu.
// Format:
// [
//   {
//     name: string,
//     label: string, - optional for predefined (there is default) / mandatory for custom
//     route: string, - optional for predefined (there is default) / mandatory for custom
//     icon: Icon, - optional for predefined (there is default)
//     component: Component - optional for predefined (there is default) / mandatory for custom
//   }
// ]
// Predefined: Home, Connections, Credentials, Settings
export const MENU_NAVIGATION_OPTIONS = null

// component to be displayed in the navigation drawer at the top, above the navigation section
export const DrawerHeaderContent = null

// component to be displayed in the navigation drawer at the bottom, below the navigation section
export const DrawerFooterContent = null

// additional routes need to be registered in the app navigator inside Screens Stack Navigator (see https://reactnavigation.org/docs/stack-navigator/)
// Format:
// [
//   {
//     route: string, - route name
//     component: Component, - React Component to render
//     navigationOptions: object, - see https://reactnavigation.org/docs/screen-options
//   }
// ]
// Predefined: Home, Connections, Credentials, Settings
export const EXTRA_SCREENS = null

// additional routes need to be registered in the app navigator inside Modal Windows Stack Navigator (see https://reactnavigation.org/docs/stack-navigator/)
// Format:
// [
//   {
//     route: string, - route name
//     component: Component, - React Component to render
//     navigationOptions: object, - see https://reactnavigation.org/docs/screen-options
//   }
// ]
// Predefined: Home, Connections, Credentials, Settings
export const EXTRA_MODALS = null

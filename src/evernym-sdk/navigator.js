// @flow

/*
 * Here is you can customize Navigation menu
 * */

// options (and their labels) to be shown.
export const navigationOptions = {
  connections: { label: 'My Connections' },
  credentials: { label: 'My Credentials' },
  settings: { label: 'Settings' },
}

// component to be displayed in the navigation drawer at the top, above the navigation section
export function DrawerHeaderContent(props: {
  height: number,
  width: number,
  fill: string,
}) {
  return null
}

// component to be displayed in the navigation drawer at the bottom, below the navigation section
export function DrawerFooterContent() {
  return null
}

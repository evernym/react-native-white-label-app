### Advanced

This document contains information about the internal SDK structure.
It can be useful for developers who want to provide their own implementations for existing screens or to add new ones.  

* [Store](#store)
* [Selectors](#selectors)
* [Actions](#actions)
* [Components](#components)

### Store
**TODO**

### Selectors
**TODO**

### Actions
**TODO**

### Components

##### Headers

1. `Header` - base header with optional back arrow.

    Properties:
    * `headline`- Optional(string) - head title
    * `hideBackButton`- Optional(boolean) - hide arrow allowing back navigation
    * `transparent` - Optional(boolean) - show/hide border at the bottom
    * `navigation` - NavigationStackProp<NavigationRoute> - react navigation
    * `route` - NavigationRoute - react navigation 
    
    Example: 
    ```javascript
      <Header
        headline="Page"
        navigation={navigation}
        route={route}
      />
    ```
   
   Example page where is used in default app: About / Change Password pages. 

1. `HeaderWithMenu` - header with burger menu at the left which opens navigation menu

    Properties:
    * `headline`- Optional(string) - head title
    * `showUnreadMessagesBadge`- Optional(string) - show label indicating number of unread messages badge, and it's location ('menu', 'title', else to hide)
    * `navigation` - NavigationStackProp<NavigationRoute> - react navigation
    * `route` - NavigationRoute - react navigation 
    
    Example: 
    ```javascript
      <HeaderWithMenu
        headline="Page"
        navigation={navigation}
        route={route}
        showUnreadMessagesBadge={true}
      />
    ```

   Example page where is used in default app: Connections / Credentials / Settings pages. 

1. `HeaderWithDeletion` - header with dots at the right which opens native action dialog

    Properties:
    * `headline`- Optional(string) - head title
    * `showImage`- Optional(boolean) - show image near with title
    * `image`- Optional(image source) - image uri
    * `onDelete`- Optional(function: () => {}) - function to call on delete action
    * `onDeleteButtonTitle`- Optional(boolean) - label for delete button
    * `navigation` - NavigationStackProp<NavigationRoute> - react navigation
    * `route` - NavigationRoute - react navigation 
    
    Example: 
    ```javascript
      <HeaderWithDeletion
        headline="Page"
        onDeleteButtonTitle="Delete"
        onDelete={() => {}}
        navigation={navigation}
        route={route}
      />
    ```
   
   Example page where is used in default app: Connection Details / Credential Details pages. 
   
**TODO**

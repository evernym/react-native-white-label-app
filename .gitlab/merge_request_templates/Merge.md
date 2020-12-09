## Reason for Pull Request

- [ ] Bug fix
- [ ] Feature/Change request

## Link for jira ticket
[MSDK-](http://evernym.atlassian.net/browse/MSDK-)

## In case of Bug

### Root cause

- Backend API change
- Requirement was not clear

## In case of Feature/Change request

### High level description of changes done

- Added a store to save user response for push notification and then use it while onboarding user. We can't start onboarding process until we get push notification token from user

## Tests written for Bug/Feature/Refactoring

- `<Please write test file/test name here>`

## Checklist

### Did you create a new screen? If yes, then complete following checklist before raising a Pull Request

- [ ] I have checked the hardware back button functionality required for the screens in Android. I have added the routeNames that are need to be handled for the back button in app.js
- [ ] I have checked the back behaviour by swiping left or swiping down on screens and they behave as expected. Back behaviour of these screens has been approved by product team
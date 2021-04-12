// @flow
import * as React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

jest.mock('react-native-screens', () => {
  const RealComponent = jest.requireActual('react-native-screens')
  RealComponent.enableScreens = jest.fn()
  return RealComponent
})

const Stack = createStackNavigator()
export const MockedNavigator = ({
  component,
  params = {},
}: {
  component: React.ElementType,
  params?: Object,
}) => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="MockedScreen" initialParams={params}>
          {component}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  )
}

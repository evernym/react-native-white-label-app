// @flow
import * as React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/stack'

const Stack = createNativeStackNavigator()
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

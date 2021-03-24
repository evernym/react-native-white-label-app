// @flow
import { StyleSheet } from 'react-native'

export const getInviteActionStylesObject = () => ({
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: 'transparent',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative',
  },
  listStyle: { flex: 1, padding: 20 },
  questionDetails: {
    paddingTop: 20,
    paddingBottom: 20,
    minHeight: 250,
    justifyContent: 'center',
    marginBottom: 25,
  },
})

export const inviteActionStyles = StyleSheet.create(
  getInviteActionStylesObject()
)

import { Navigation } from 'react-native-navigation'
import { Provider } from 'react-redux'
import { registerScreens } from '../screens/index'
import store from '../store/store'
import { screen } from 'uPortMobile/lib/actions/metricActions'
import requestQueue from '../utilities/requestQueue'
import { handleURL } from '../actions/requestActions'
/**
 * Register screens and components for react native navigation
 */
registerScreens({ store, Provider })

/**
 * Register global event listener for screen
 */
const App = () => {
  Navigation.events().registerComponentDidAppearListener(({ componentName }) => {
    store.dispatch(screen(componentName))
  })

  requestQueue((url: string) => store.dispatch(handleURL(url)))
}

export default App

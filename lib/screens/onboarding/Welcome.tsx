import * as React from 'react'
import { Image } from 'react-native'
import { Navigator } from 'react-native-navigation'
import { Screen, Container, Button, Text, Images } from '@kancha'

interface WelcomeProps {
  navigator: Navigator
}

class Welcome extends React.Component<WelcomeProps> {
  render() {
    return (
      <Screen
        backgroundImage={Images.backgrounds.purpleGradientWithPattern}
        type={Screen.Types.Custom}
        config={Screen.Config.SafeNoScroll}
        statusBarHidden
      >
        <Container flex={1}>
          <Container flex={1} justifyContent={'space-around'} alignItems={'center'} paddingTop={50}>
            <Image source={Images.branding.logoWhite} style={{ height: 100 }} resizeMode={'contain'} />
            <Text type={Text.Types.H3} textColor={'white'} bold textAlign={'center'}>
              Get started by creating a new identity.
            </Text>
          </Container>
          <Container flex={1} paddingTop>
            <Button
              bold
              centered
              buttonText={'Create New Identity'}
              onPress={() => this.props.navigator.push({ screen: 'onboarding2.Learn' })}
              type={Button.Types.Custom}
              block={Button.Block.Filled}
            />
            <Button
              bold
              centered
              buttonText={'Recover Identity'}
              onPress={() => 'Recover Identity'}
              type={Button.Types.Custom}
              block={Button.Block.Clear}
            />
          </Container>
        </Container>
      </Screen>
    )
  }
}

export default Welcome

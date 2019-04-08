import * as React from 'react'
import { ViewStyle, SafeAreaView } from 'react-native'
import { Container, Button, Text, Icon } from '@kancha'
import { RNCamera } from 'react-native-camera'

interface ScannerProps {
  /**
   * Callback when barcode has been read
   */
  onBarcodeRead: (event: any) => void
  /**
   * Close the scanner
   */
  closeScanner: () => void
}

const QRCodeScanner: React.FC<ScannerProps> = ({ onBarcodeRead, closeScanner }) => {
  const scannerViewStyles: ViewStyle = {
    flex: 1,
    justifyContent: 'flex-end',
  }

  return (
    <RNCamera
      captureAudio={false}
      onBarCodeRead={onBarcodeRead}
      style={{ flex: 1 }}
      pendingAuthorizationView={
        <Container flex={1} backgroundColor={'black'} alignItems={'center'} justifyContent={'center'} padding={20}>
          <Container paddingBottom>
            <Text type={Text.Types.H2} textColor={'white'} textAlign={'center'}>
              Permissions
            </Text>
          </Container>
          <Text type={Text.Types.SubTitle}>Checking if camera permissions are enabled...</Text>
        </Container>
      }
      notAuthorizedView={
        <Container flex={1} backgroundColor={'black'} alignItems={'center'} justifyContent={'center'} padding={20}>
          <Container paddingBottom>
            <Text type={Text.Types.H2} textColor={'white'} textAlign={'center'}>
              Connect with uPort
            </Text>
          </Container>
          <Text type={Text.Types.SubTitle}>
            QR scanner requires camera access. Enable camera access in settings so you can scan QR codes and start
            connecting to apps.
          </Text>
        </Container>
      }
    >
      <SafeAreaView style={scannerViewStyles}>
        <Button
          type={Button.Types.Primary}
          onPress={() => {
            ''
          }}
          block={Button.Block.Clear}
          icon={<Icon size={30} name={'x'} />}
        />
      </SafeAreaView>
    </RNCamera>
  )
}

export default QRCodeScanner

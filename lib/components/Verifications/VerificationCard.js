// Copyright (C) 2018 ConsenSys AG
//
// This file is part of uPort Mobile App.
//
// uPort Mobile App is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// uPort Mobile App is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with uPort Mobile App.  If not, see <http://www.gnu.org/licenses/>.
//
// Frameworks
import React from 'react'
import { connect } from 'react-redux'
import { Text, View, Platform, StyleSheet, FlatList, TouchableOpacity, Linking, Image } from 'react-native'
import { toJs, get } from 'mori'
import NestedInfo from 'uPortMobile/lib/components/shared/NestedInfo'
import ExpirationItem from 'uPortMobile/lib/components/Verifications/ExpirationItem'
import { AcceptCancelGroup } from 'uPortMobile/lib/components/shared/Button'

// Selectors
import { externalProfile } from 'uPortMobile/lib/selectors/requests'
import { sha3_256 } from 'js-sha3'

// Actions
import { removeAttestation } from 'uPortMobile/lib/actions/uportActions'
import { cancelRequest } from 'uPortMobile/lib/actions/requestActions'

// Styles
import { colors, fontLight } from 'uPortMobile/lib/styles/globalStyles'
import { Icon } from '@kancha'
const compassIcon = require('uPortMobile/assets/images/compass.png')

const UseCredentialCard = props => {
  const useCredentialInfo = claim => {
    let useCredential = ''
    Object.keys(claim).map(key => {
      if (typeof claim[key] === 'object') {
        Object.keys(claim[key]).map(subbkey => {
          if (subbkey === 'useCredential' && typeof claim[key][subbkey] === 'object') {
            useCredential = claim[key][subbkey]
            return
          }
        })
      }
    })
    return useCredential.hasOwnProperty('url') && useCredential.url.startsWith('https://') && useCredential
  }
  const { url, text } = useCredentialInfo(props.claim)
  const useCredential = url => {
    Linking.openURL(url)
    props.authorizeRequest(props.request)
  }
  return url ? (
    <View>
      <TouchableOpacity
        onPress={() => useCredential(url)}
        style={{
          paddingVertical: 20,
          paddingHorizontal: 15,
          margin: 10,
          borderRadius: 5,
          shadowColor: '#000000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          backgroundColor: colors.brand,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <View style={{ borderRadius: 5, backgroundColor: '#ffffff', padding: 8 }}>
          <Image source={compassIcon} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>{text || 'Use Credential Now'}</Text>
          <Text style={{ color: '#ffffff', fontSize: 13 }}>{url}</Text>
        </View>
        <View>
          <Icon name='forward' color='#ffffff' size={22} />
        </View>
      </TouchableOpacity>
      <Text style={{ fontSize: 12, textAlign: 'center', paddingBottom: 10, color: colors.grey74 }}>
        *Your credential will be saved
      </Text>
    </View>
  ) : null
}

export class VerificationCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modalVisible: false,
      selectedVerification: false,
    }
    this.deleteVerification = this.deleteVerification.bind(this)
  }

  deleteVerification() {
    const tokenHash = sha3_256(this.props.verification.token)
    this.props.removeAttestation(this.props.address, tokenHash)
  }

  render() {
    const showUrl = this.props.issuer && this.props.issuer.url !== undefined

    return (
      <View style={styles.cardContainer}>
        <View style={styles.fromContainer}>
          <View style={styles.row}>
            <Text style={styles.fromIssuer}>
              from:
              <Text style={{ fontWeight: '600' }}>
                {this.props.issuer && this.props.issuer.name
                  ? this.props.issuer.name
                  : this.props.verification.iss && this.props.verification.iss.slice(0, 16)}
              </Text>
            </Text>
            <ExpirationItem d={this.props.verification.exp} />
          </View>
          {showUrl && (
            <View style={styles.url}>
              <TouchableOpacity onPress={() => Linking.openURL(this.props.issuer.url)}>
                <Text style={{ color: colors.purple }}>{this.props.issuer.url}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <UseCredentialCard
          claim={this.props.verification.claim}
          request={this.props.request}
          authorizeRequest={this.props.authorizeRequest}
        />
        <View style={styles.verificationContainer}>
          <NestedInfo componentId={this.props.componentId} data={this.props.verification.claim} />
        </View>
        {this.props.showActions && (
          <AcceptCancelGroup
            acceptText={'Save'}
            cancelText='Decline'
            onAccept={() => this.props.authorizeRequest(this.props.request)}
            onCancel={() => this.props.cancelRequest(this.props.request)}
          />
        )}
      </View>
    )
  }
}
const mapStateToProps = (state, ownProps) => {
  return {
    address: ownProps.verification.sub,
    issuer: (ownProps.verification && toJs(externalProfile(state, ownProps.verification.iss))) || {},
  }
}

const mapDispatchToProps = dispatch => {
  return {
    removeAttestation: (address, token) => dispatch(removeAttestation(address, token)),
    authorizeRequest: activity => dispatch(cancelRequest(activity.id)),
    cancelRequest: activity => dispatch(cancelRequest(activity.id)),
  }
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    flex: 0,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  url: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 10,
  },
  fromContainer: {
    backgroundColor: colors.white,
    padding: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.grey216,
  },
  fromIssuer: {
    fontFamily: fontLight,
    fontSize: 14,
    lineHeight: 19,
    color: colors.grey74,
  },
  verificationContainer: {
    flex: 1,
    flexDirection: 'column',
  },
})

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(VerificationCard)

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
import React from 'react'
import PropTypes from 'prop-types'
import { StyleSheet, Text, View, Image, TouchableOpacity, Linking } from 'react-native'
import { connect } from 'react-redux'
import InteractionStats from '../partials/InteractionStats'
import RequestItem, { RequestItemList } from '../partials/RequestItem'
import { PrimaryButton } from 'uPortMobile/lib/components/shared/Button'
import Status from 'uPortMobile/lib/components/shared/Status'
import { debounce } from 'lodash'
import Avatar from 'uPortMobile/lib/components/shared/Avatar'
import EvilIcon from 'react-native-vector-icons/EvilIcons'
import AccountTileSmall from 'uPortMobile/lib/components/shared/AccountTileSmall'
// Selectors
import { clientProfile, currentRequest, externalProfile } from 'uPortMobile/lib/selectors/requests'
import { publicUport, currentAddress, interactionStats, subAccounts } from 'uPortMobile/lib/selectors/identities'
import { requestedOwnClaims, requestedVerifiableClaims, missingClaims } from 'uPortMobile/lib/selectors/attestations'
import { working, errorMessage } from 'uPortMobile/lib/selectors/processStatus'
import { endpointArn } from 'uPortMobile/lib/selectors/snsRegistrationStatus'
import { networkSettingsForAddress } from 'uPortMobile/lib/selectors/chains'
import { profileForDID } from 'uPortMobile/lib/selectors/vc'

import { toJs, get } from 'mori'
import verifiedByUport from 'uPortMobile/lib/utilities/verifiedByUport'
import { networks } from 'uPortMobile/lib/utilities/networks'
import { formatWeiAsEth } from 'uPortMobile/lib/helpers/conversions'

// Actions
import { authorizeRequest, cancelRequest, clearRequest, authorizeAccount } from 'uPortMobile/lib/actions/requestActions'

// Styles
import { textStyles, colors, fontBold } from 'uPortMobile/lib/styles/globalStyles'
import { metrics, defaultTheme } from 'uPortMobile/lib/styles/index'

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    marginBottom: 40,
    marginTop: 22,
  },
  errorMessage: {
    borderColor: '#C94444',
    padding: 10,
    margin: 15,
    marginBottom: 0,
    backgroundColor: '#E86B6B',
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
  },
  accountAvatar: {
    marginRight: metrics.spacing.horizontal.medium,
  },
  accountTile: {
    marginLeft: metrics.spacing.horizontal.medium,
    marginRight: metrics.spacing.horizontal.medium,
    paddingLeft: metrics.spacing.horizontal.medium,
    paddingRight: metrics.spacing.horizontal.medium,
    paddingTop: metrics.spacing.vertical.medium,
    paddingBottom: metrics.spacing.vertical.medium,
    backgroundColor: defaultTheme.colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgb(0,0,0)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(92,80,202,1)',
  },
  credentialsListContainer: {
    flex: 0,
    borderWidth: 0.1,
    borderRadius: 8,
    shadowRadius: 8,
    shadowColor: 'rgb(0,0,0)',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 30,
    marginTop: 30,
  },
  smallText: {
    marginLeft: metrics.spacing.horizontal.medium,
    textAlign: 'left',
    fontWeight: 'bold',
    color: colors.grey4,
    fontSize: 12,
    paddingBottom: 12,
    flex: 0,
  },
  smallTouchableOpacity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 27,
    paddingRight: 27,
    paddingTop: 19,
    paddingBottom: 19,
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
    fontSize: 24,
    color: '#3F3D4B',
  },
  disclosureBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 22,
    paddingLeft: 16,
    paddingRight: 22,
  },
  url: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
})

const parseErrorMessage = message => {
  return message.startsWith('JWT has expired') ? 'This credential has expired.' : message
}

export const DisclosureCard = props => {
  const showUrl = props.client && props.client.url !== undefined

  return (
    <View style={{ flex: 0, flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-end' }}>
      <View style={{ flex: 0, justifyContent: 'center', alignItems: 'center' }}>
        {props.client && props.client.avatar ? (
          <Image resizeMode='cover' source={props.client.avatar} style={{ borderRadius: 3, height: 70, width: 70 }} />
        ) : null}
      </View>
      {showUrl && (
        <View style={styles.url}>
          <TouchableOpacity onPress={() => Linking.openURL(props.client.url)}>
            <Text style={{ color: 'white' }}>{props.client.url}</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <InteractionStats stats={props.interactionStats} actionText='interacted' counterParty={props.client} />
      </View>

      <View
        style={{
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-end',
          flex: 0,
          backgroundColor: '#F6F5FE',
          paddingBottom: 20,
        }}
      >
        <View style={[styles.disclosureBar, { marginBottom: 0, paddingBottom: 10 }]}>
          <Text style={[styles.cardTitle, { textAlign: 'left' }]}>Login</Text>
          <TouchableOpacity
            onPress={() => props.cancelRequest(props.requestId)}
            style={{
              position: 'absolute',
              height: 44,
              width: 44,
              top: 16,
              right: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EvilIcon size={30} name='close' color='rgba(155,155,155,1)' />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 0, flexDirection: 'column' }}>
          {!!props.actType && (props.actType === 'none' || props.accountAuthorized === true) ? (
            <View style={styles.credentialsListContainer}>
              <Text style={[styles.smallText, { paddingLeft: 0, paddingTop: 12, textAlign: 'left' }]}>Profile</Text>
              <RequestItemList>
                {Object.keys(props.requested || {}).map((claim, i) => (
                  <RequestItem
                    key={i + claim}
                    type={claim.toUpperCase()}
                    value={typeof props.requested[claim] !== 'object' ? props.requested[claim] : null}
                  />
                ))}

                {props.pushPermissions ? (
                  <RequestItem
                    key='pushPermissions'
                    type='Push Notifications'
                    value={
                      props.snsRegistered
                        ? 'Allow'
                        : props.pushWorking
                        ? 'Registering'
                        : props.pushError || 'Not available'
                    }
                  />
                ) : null}

                {props.network ? (
                  <RequestItem key={'requestednetwork'} type='Network' value={props.networkName} />
                ) : null}

                {props.network || props.account ? (
                  <RequestItem
                    key={'accountaddress'}
                    type='Address'
                    value={
                      props.account ||
                      `New account will be created for ${
                        props.actType === 'segregated'
                          ? props.client.name || props.client.address.slice(0, 10)
                          : props.networkName
                      }`
                    }
                  />
                ) : null}
              </RequestItemList>
              {props.verified.length > 0 || props.missing.length > 0 ? (
                <View>
                  <Text style={[styles.smallText, { paddingLeft: 0, paddingTop: 12, textAlign: 'left' }]}>
                    Verifiable Credentials
                  </Text>
                  <RequestItemList>
                    {props.verified.map((vc, i) => (
                      <RequestItem
                        key={vc.iss + '-' + i}
                        type={vc.claimType}
                        value={vc.claim[vc.claimType]}
                        vc={vc}
                        componentId={props.componentId}
                      />
                    ))}
                    {props.missing.map((spec, i) => (
                      <RequestItem key={spec.type + '-' + i} type={spec.type} spec={spec} />
                    ))}
                  </RequestItemList>
                </View>
              ) : null}
            </View>
          ) : null}

          {props.createSubAccount ? <Status process='createSubAccount' /> : null}

          {props.error ? <Text style={styles.errorMessage}>{parseErrorMessage(props.error)}</Text> : null}

          {props.actType !== 'none' && props.account && props.accountAuthorized === false ? (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.smallText}>Selected Account</Text>
              <AccountTileSmall
                accountProfile={props.client}
                balance={props.ethBalance}
                usdBalance={props.usdBalance}
              />
            </View>
          ) : null}

          {props.actType !== 'none' && props.account && props.accountAuthorized === false ? (
            <View style={styles.smallTouchableOpacity}>
              <TouchableOpacity onPress={() => props.authorizeAccount(props.requestId, 'new')}>
                <Text style={{ color: defaultTheme.colors.brand, fontSize: 12, lineHeight: 15 }}>
                  {' '}
                  Create new account{' '}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {props.actType === 'none' || props.accountAuthorized === true ? (
            <PrimaryButton
              onPress={() => props.authorizeRequest(props.requestId)}
              disabled={props.missingRequired}
              style={{ marginLeft: 16, marginRight: 16, marginTop: 0, marginBottom: 30 }}
            >
              <Text style={{ fontSize: 18 }}> Share to Login </Text>
            </PrimaryButton>
          ) : null}

          {props.actType !== 'none' && !props.account && props.accountAuthorized === false ? (
            <PrimaryButton
              disabled={props.pushWorking || !!props.error}
              onPress={() => props.authorizeAccount(props.requestId, 'new')}
              style={{ marginLeft: 16, marginRight: 16, marginTop: 0, marginBottom: 30 }}
            >
              <Text style={{ fontSize: 18 }}> Create New Account </Text>
            </PrimaryButton>
          ) : null}

          {props.actType !== 'none' && props.account && props.interactionStats && props.accountAuthorized === false ? (
            <PrimaryButton
              onPress={() => props.authorizeAccount(props.requestId, 'existing')}
              style={{ marginLeft: 16, marginRight: 16, marginTop: 0, marginBottom: 30 }}
            >
              <Text style={{ fontSize: 18 }}> Login with Existing </Text>
            </PrimaryButton>
          ) : null}
        </View>
      </View>
    </View>
  )
}

DisclosureCard.propTypes = {
  pushPermissions: PropTypes.bool,
  network: PropTypes.string,
  actType: PropTypes.string,
  authorized: PropTypes.bool,
  accountAuthorized: PropTypes.bool,
  verified: PropTypes.array,
  missing: PropTypes.array,
  missingRequired: PropTypes.bool,
  requested: PropTypes.object,
  currentIdentity: PropTypes.object,
  client: PropTypes.object,
  authorizeRequest: PropTypes.func,
  authorizeAccount: PropTypes.func,
  cancelRequest: PropTypes.func,
  clearRequest: PropTypes.func,
}

const mapStateToProps = state => {
  const request = currentRequest(state) || {}
  const account = request.account
  const accountProfile = request.client_id ? toJs(externalProfile(state, request.client_id)) : null
  const network = networks[request.network] || { network_id: request.network, name: request.network }
  const networkName = network.name
  const client = clientProfile(state)
  const currentIdentity = toJs(publicUport(state))
  const requested = requestedOwnClaims(state, request && request.requested)
  const verified = request && request.verified ? requestedVerifiableClaims(state, request.verified) : []
  const missing = request && request.verified ? missingClaims(state, request.verified) : []
  const missingRequired = !!missing.find(spec => spec.essential)
  const uportVerified = request && request.client_id ? verifiedByUport[request.client_id] : false
  const pushWorking = working(state, 'push')
  const pushError = errorMessage(state, 'push')
  const createSubAccount = working(state, 'createSubAccount')
  const networkSettings = networkSettingsForAddress(state, account) || {}
  const ethBalance =
    networkSettings.balance && networkSettings.balance.ethBalance
      ? formatWeiAsEth(networkSettings.balance.ethBalance)
      : 0
  const usdBalance =
    networkSettings.balance && networkSettings.balance.usdBalance ? networkSettings.balance.usdBalance : 0

  let stats
  let shareStats
  if (request) {
    stats = toJs(get(interactionStats(state), request.client_id)) || 0
    shareStats = { shared: stats.share || 0 }
  }
  return {
    currentIdentity,
    client,
    account,
    accountProfile,
    network: request.network,
    networkName,
    actType: request.actType,
    accountAuthorized: request.accountAuthorized || false,
    requestId: request.id,
    error: (request || {}).error,
    pushPermissions: !!request.pushPermissions,
    authorized: !!request.authorizedAt,
    pushWorking,
    createSubAccount,
    pushError,
    requested,
    verified,
    missing,
    missingRequired,
    uportVerified,
    interactionStats: shareStats,
    snsRegistered: !!endpointArn(state),
    ethBalance,
    usdBalance,
  }
}

const mapDispatchToProps = dispatch => ({
  clearRequest: () => {
    dispatch(clearRequest())
  },
  authorizeAccount: (activity, type) => dispatch(authorizeAccount(activity, type)),
  authorizeRequest: activity => dispatch(authorizeRequest(activity)),
  cancelRequest: activity => dispatch(cancelRequest(activity)),
  accountProfileLookup: clientId => toJs(dispatch(externalProfile(clientId))),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DisclosureCard)

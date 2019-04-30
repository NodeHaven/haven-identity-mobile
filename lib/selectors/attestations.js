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
import { createSelector } from 'reselect'
import { isEmpty, toJs, merge, toClj, hashMap, hasKey, count, selectKeys, vector, assoc, flatten, get, getIn, vals, map, reduce, reduceKV, inc, updateIn, sortedMap, first, groupBy, keys, dissoc, filter, sortBy, concat, conj } from 'mori'
import { currentIdentity, ownClaims, currentDidObject, externalIdentities as external } from './identities'
import { allProfiles } from './vc'

// Cut of for fixing JWT timestamps incorrectly set using milliseconds
export const JWT_MS_CUTOFF = 1451628000000

function normalizeTime (secsOrMs) {
  return secsOrMs > JWT_MS_CUTOFF ? Math.floor(secsOrMs / 1000) : secsOrMs
}

const externalIdentities = createSelector(
  [external, allProfiles],
  (ext, vcs) => vcs.reduce((all, profile) => updateIn(all, [profile.address], p => merge(p, toClj(profile))), ext || hashMap())
)

// NEEDS ERROR HANDLING
// Props needs to have the following values:
// - `issuer` an address
export const issuedBy = (state, props) => {
  return filter((att) => get(att, 'iss') === props.issuer, attestationLedger(state))
}

const claimsForSpec = (spec, claims) => {
  const claimType = typeof spec === 'object' ? spec.type : spec
  if (typeof claimType !== 'string') return []

  const candidates = map(claim => assoc(claim, 'claimType', claimType), filter(claim => hasKey(get(claim, 'claim'), claimType), claims))
  if (typeof spec === 'object' && spec.iss) {
    const iss = spec.iss.map ? spec.iss.map(spec => spec.did) : [spec.iss]
    return filter(claim => iss.includes(get(claim, 'iss')), candidates)
  } else {
    return candidates
  }
}
export const requestedAttestations = (state, requested) => {
  const all = onlyLatestAttestations(state)
  return flatten(map(spec => claimsForSpec(spec, all), requested))
}

const requested = (state, params) => params

const forIssuerAndClaimType = (state, iss, claimType) => ({iss, claimType})

// Props needs to have the following values:
// - `claimType` (eg. `name` or `phone`)
// - `claimValue` (eg. `Alice` ....)

export const forTypeAndValue = (state, props) => {
  return filter((att) => getIn(att, ['claim', props.claimType]) === props.claimValue, onlyLatestAttestations(state))
}

// This represents an array of claim objects
// { sub: '0x88647b5a94cd8347c8f76c7b79c85bbfbf0e13a9',
// claim: { employer: 'Consensys AG' },
// iss: '0x88647b5a94cd8347c8f76c7b79c85bbfbf0e13a9',
// iat: 1482268217248,
// exp: 1482354617248,
// token: 'tokenstring' }

// Return a mori object of the attestations for the current identity
export const attestationLedger = createSelector(
  [currentIdentity, currentDidObject],
 (identity, did) => sortBy(a => normalizeTime(get(a, 'iat')), (a, b) => b - a, concat(vals(get(identity, 'attestations')), vals(get(did, 'attestations'))))
// (identity, did) => concat(reverse(vals(get(identity, 'attestations'))), reverse(vals(get(did, 'attestations'))))
)

// Return a mori object of the most recent attestations for the current identity
export const onlyLatestAttestations = createSelector(
  [attestationLedger],
  (attestations) => map(first, vals(groupBy(a => vector(get(a, 'iss'), get(a, 'claim')), attestations)))
)

// Return a mori object with the following structure
// This represents an object that has keys for the attestations and an object
// with values and the number of attestations for each attestation
// { employer: { 'Consensys AG': 5 } }
export const thirdPartyAttestationSummary = createSelector(
  [onlyLatestAttestations],
  (attestations) =>
    reduce(
      (summary, att) => {
        // TODO this only deals with a single entry claims map. It should handle multiples
        const claim = get(att, 'claim')
        const claimType = first(keys(claim))
        return updateIn(summary, [claimType, get(claim, claimType)], inc)
      },
      sortedMap(),
      attestations
    )
)

// Return a mori object with the follow structure
// This represents a summary of all attestations with included claims
// { employer: { 'Consensys AG': 5 },
//   name: { 'Ashoka Finley': 0 },
//   phone: { '13104041586': 0 } }
export const attestationSummaryStats = createSelector(
  [thirdPartyAttestationSummary, ownClaims],
  (attestations, own) =>
    reduceKV((summary, type, value) => updateIn(summary, [type, value], (amount) => amount || 0),
          attestations,
          dissoc(own, 'connections'))
)

// Return a JS object from the attestationSummaryStats
export const attestationSummary = createSelector(
  [attestationSummaryStats],
  (summary) => toJs(summary))

// Return a mori object with all the attestations for the current identity
export const allClaims = createSelector(
  [attestationSummaryStats],
  summary => reduceKV((m, type, value) => assoc(m, type, first(keys(value))), hashMap(), summary)
)

// Return a JS object of the requested claims
// Return an empty object if none are present
export const requestedClaims = createSelector(
  [allClaims, requested],
  (claims, params) => toJs(selectKeys(claims, map(claimType => typeof claimType === 'object' ? claimType.type : claimType, params)))
)

// Return a JS object of the requested claims
// Return an empty object if none are present
export const requestedOwnClaims = createSelector(
  [ownClaims, requested],
  (claims, params) => toJs(selectKeys(claims, params))
)

// NEEDS ERROR HANDLING
// Returns a js object for typeAndValue for only the latest attestations
// Returns an empty array if none are present
export const attestationsForTypeAndValue = createSelector(
  [forTypeAndValue], (attestations) => toJs(attestations)
)

// Not Used
export const attestationsIssuedBy = createSelector(
  [issuedBy], (attestations) => toJs(attestations)
)

// Not Used
export const verifiedClaims = createSelector(
  [requestedAttestations],
  (attestations) => toJs(attestations)
)

// Returns a JS object of tokens of verifiedClaims
// Returns an empty object if none are found
export const verifiedClaimsTokens = createSelector(
  [requestedAttestations],
  (attestations) => toJs(map(a => get(a, 'token'), attestations))
)

// Not Used
export const verifiedClaimsByClaim = createSelector(
  [requestedAttestations],
  (attestations) => toJs(groupBy(a => get(a, 'claim'), attestations))
)

export const requestedWithIssuer = createSelector(
  [requestedAttestations, externalIdentities],
  (attestations, issuers) => {
    return map(att => assoc(att, 'issuer', get(issuers, get(att, 'iss'), {})), attestations)
  }
)

export const requestedVerifiableClaims = createSelector(
  [requestedWithIssuer],
  attestations => toJs(attestations)
)

export const missingClaims = createSelector(
  [requestedWithIssuer, requested],
  (attestations, requested) => requested.map(spec => typeof spec === 'object' ? spec : {type: spec}).filter(spec => isEmpty(filter(vc => get(vc, 'claimType') === spec.type, attestations)))
)

export const verifiedClaimsByType = createSelector(
  [requestedWithIssuer],
  (attestations) => toJs(groupBy(a => first(keys(get(a, 'claim'))), attestations))
)

export const attestationsForIssuerAndType = createSelector(
  [onlyLatestAttestations, forIssuerAndClaimType],
  (attestations, {iss, claimType}) => filter((att) => get(att, 'iss') === iss && getIn(att, ['claim', claimType]), attestations)
)

export const onlyLatestAttestationsWithIssuer = createSelector(
  [onlyLatestAttestations, externalIdentities],
  (latest, issuers) => toJs(map(
    att => assoc(att, 'issuer', get(issuers, get(att, 'iss'), {})),
    latest))
)

export const hasAttestations = createSelector(
  [onlyLatestAttestations],
  attestations => !isEmpty(attestations)
)

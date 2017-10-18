/** @format */
/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { flowRight, get } from 'lodash';
import { localize } from 'i18n-calypso';
import Gridicon from 'gridicons';

/**
 * Internal dependencies
 */
import DisconnectSurvey from './disconnect-survey';
import MissingFeature from './missing-feature';
import TooDifficult from './too-difficult';
import TooExpensive from './too-expensive';
import DocumentHead from 'components/data/document-head';
import FormattedHeader from 'components/formatted-header';
import NavigationLink from 'components/wizard/navigation-link';
import { getSelectedSiteSlug } from 'state/ui/selectors';
import CompactCard from 'components/card/compact';
import Main from 'components/main';
import SectionHeader from 'components/section-header';
import Placeholder from 'my-sites/site-settings/placeholder';
import redirectNonJetpack from 'my-sites/site-settings/redirect-non-jetpack';

export const reasonComponents = {
	'missing-feature': MissingFeature,
	'too-difficult': TooDifficult,
	'too-expensive': TooExpensive,
};

const DisconnectSite = ( { reason, siteSlug, translate } ) => {
	if ( ! siteSlug ) {
		return <Placeholder />;
	}

	const ReasonComponent = get( reasonComponents, reason, DisconnectSurvey );
	const confirmHref = '/settings/disconnect-site/confirm/' + siteSlug;

	let backHref = '/settings/manage-connection/' + siteSlug;
	if ( reason ) {
		backHref = '/settings/disconnect-site/' + siteSlug;
	}

	return (
		<div>
			<Main className="disconnect-site__site-settings">
				<DocumentHead title={ translate( 'Site Settings' ) } />
				<FormattedHeader
					headerText={ translate( 'Disconnect Site' ) }
					subHeaderText={ translate(
						"We'd love to know why you're disconnecting -- it will help us improve Jetpack."
					) }
				/>
				<ReasonComponent confirmHref={ confirmHref } />
				<div className="disconnect-site__navigation-links">
					<NavigationLink href={ backHref } direction="back" />
					<NavigationLink href={ confirmHref } direction="forward" />
				</div>
				<div className="disconnect-site__troubleshooting">
					<SectionHeader label={ translate( 'Having problems with your connection?' ) } />
					<CompactCard
						href={ 'https://jetpack.com/support/debug/?url=' + siteSlug }
						target="_blank"
					>
						<Gridicon icon="refresh" />
						{ translate( 'Diagnose a connection problem' ) }
					</CompactCard>
					<CompactCard>
						<Gridicon icon="chat" />
						{ translate( 'Get help from our Happiness Engineers' ) }
					</CompactCard>
				</div>
			</Main>
		</div>
	);
};

const connectComponent = connect( state => ( {
	siteSlug: getSelectedSiteSlug( state ),
} ) );

export default flowRight( connectComponent, localize, redirectNonJetpack() )( DisconnectSite );

/**
 * External dependencies
 */
import React, { PropTypes } from 'react';
import Gridicon from 'gridicons';
import { localize } from 'i18n-calypso';
import { connect } from 'react-redux';
import { isNumber } from 'lodash';

/**
 * Internal dependencies
 */
import ActionHeader from 'woocommerce/components/action-header';
import Button from 'components/button';
import { getLink } from 'woocommerce/lib/nav-utils';
import { getCurrentlyEditingShippingZone } from 'woocommerce/state/ui/shipping/zones/selectors';
import { getSelectedSite } from 'state/ui/selectors';
import { getActionList } from 'woocommerce/state/action-list/selectors';
import { areCurrentlyEditingShippingZoneLocationsValid } from 'woocommerce/state/ui/shipping/zones/locations/selectors';

const ShippingZoneHeader = ( { zone, site, onSave, onDelete, translate, canSave, isSaving } ) => {
	const currentCrumb = zone && isNumber( zone.id )
		? ( <span>{ translate( 'Edit Shipping Zone' ) }</span> )
		: ( <span>{ translate( 'Add New Shipping Zone' ) }</span> );
	const isRestOfTheWorld = zone && 0 === Number( zone.id );

	const breadcrumbs = [
		( <a href={ getLink( '/store/settings/:site/', site ) }> { translate( 'Settings' ) } </a> ),
		( <a href={ getLink( '/store/settings/shipping/:site/', site ) }> { translate( 'Shipping' ) } </a> ),
		currentCrumb,
	];

	return (
		<ActionHeader breadcrumbs={ breadcrumbs }>
			{ ! isRestOfTheWorld && <Button borderless onClick={ onDelete } disabled={ isSaving }><Gridicon icon="trash" /></Button> }
			<Button primary onClick={ onSave } busy={ isSaving } disabled={ ! canSave || isSaving }>{ translate( 'Save' ) }</Button>
		</ActionHeader>
	);
};

ShippingZoneHeader.propTypes = {
	onSave: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};

export default connect(
	( state ) => ( {
		site: getSelectedSite( state ),
		zone: getCurrentlyEditingShippingZone( state ),
		canSave: areCurrentlyEditingShippingZoneLocationsValid( state ),
		isSaving: Boolean( getActionList( state ) ),
	} ),
)( localize( ShippingZoneHeader ) );

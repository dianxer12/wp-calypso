/** @format */
/**
 * External dependencies
 */
import { has, isEmpty, noop, throttle } from 'lodash';

/**
 * Internal dependencies
 */
import config from 'config';
import wpcom from 'lib/wp';
import {
	ANALYTICS_EVENT_RECORD,
	HAPPYCHAT_CONNECT,
	HAPPYCHAT_INITIALIZE,
	HAPPYCHAT_IO_REQUEST_TRANSCRIPT,
	HAPPYCHAT_IO_SEND_MESSAGE_EVENT,
	HAPPYCHAT_IO_SEND_MESSAGE_LOG,
	HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE,
	HAPPYCHAT_IO_SEND_MESSAGE_USERINFO,
	HAPPYCHAT_IO_SEND_PREFERENCES,
	HAPPYCHAT_IO_SEND_TYPING,
	HAPPYCHAT_SET_MESSAGE,
	HELP_CONTACT_FORM_SITE_SELECT,
	ROUTE_SET,
	COMMENTS_CHANGE_STATUS,
	EXPORT_COMPLETE,
	EXPORT_FAILURE,
	EXPORT_STARTED,
	HAPPYCHAT_BLUR,
	HAPPYCHAT_FOCUS,
	IMPORTS_IMPORT_START,
	JETPACK_CONNECT_AUTHORIZE,
	MEDIA_DELETE,
	PLUGIN_ACTIVATE_REQUEST,
	PLUGIN_SETUP_ACTIVATE,
	POST_SAVE_SUCCESS,
	PUBLICIZE_CONNECTION_CREATE,
	PUBLICIZE_CONNECTION_DELETE,
	PURCHASE_REMOVE_COMPLETED,
	SITE_SETTINGS_SAVE_SUCCESS,
} from 'state/action-types';
import {
	sendEvent,
	sendLog,
	sendPreferences,
	sendTyping,
	sendNotTyping,
} from './connection/actions';
import { wasHappychatRecentlyActive, isHappychatChatAssigned, getGroups } from './selectors';
import isHappychatConnectionUninitialized from 'state/happychat/selectors/is-happychat-connection-uninitialized';
import isHappychatClientConnected from 'state/happychat/selectors/is-happychat-client-connected';
import { getCurrentUser, getCurrentUserLocale } from 'state/current-user/selectors';
import { getHelpSelectedSite } from 'state/help/selectors';
import debugFactory from 'debug';
const debug = debugFactory( 'calypso:happychat:actions' );

const sendThrottledTyping = throttle(
	( connection, message ) => {
		sendTyping( message );
	},
	1000,
	{ leading: true, trailing: false }
);

// Promise based interface for wpcom.request
const request = ( ...args ) =>
	new Promise( ( resolve, reject ) => {
		wpcom.request( ...args, ( error, response ) => {
			if ( error ) {
				return reject( error );
			}
			resolve( response );
		} );
	} );

const sign = payload =>
	request( {
		method: 'POST',
		path: '/jwt/sign',
		body: { payload: JSON.stringify( payload ) },
	} );

const startSession = () =>
	request( {
		method: 'POST',
		path: '/happychat/session',
	} );

export const connectChat = ( connection, { getState, dispatch } ) => {
	const state = getState();
	if ( ! isHappychatConnectionUninitialized( state ) ) {
		// If chat has already initialized, do nothing
		return;
	}

	const url = config( 'happychat_url' );

	const user = getCurrentUser( state );
	const locale = getCurrentUserLocale( state );
	let groups = getGroups( state );
	const selectedSite = getHelpSelectedSite( state );
	if ( selectedSite && selectedSite.ID ) {
		groups = getGroups( state, selectedSite.ID );
	}

	const happychatUser = {
		signer_user_id: user.ID,
		locale,
		groups,
	};

	return startSession()
		.then( ( { session_id, geo_location } ) => {
			happychatUser.geo_location = geo_location;
			return sign( { user, session_id } );
		} )
		.then( ( { jwt } ) => connection.init( url, dispatch, { jwt, ...happychatUser } ) )
		.catch( e => debug( 'failed to start Happychat session', e, e.stack ) );
};

export const connectIfRecentlyActive = ( connection, store ) => {
	if ( wasHappychatRecentlyActive( store.getState() ) ) {
		return connectChat( connection, store );
	}
	return Promise.resolve(); // for testing purposes we need to return a promise
};

export const getEventMessageFromActionData = action => {
	// Below we've stubbed in the actions we think we'll care about, so that we can
	// start incrementally adding messages for them.
	switch ( action.type ) {
		case COMMENTS_CHANGE_STATUS:
			return `Changed a comment's status to "${ action.status }"`;
		case EXPORT_COMPLETE:
			return 'Export completed';
		case EXPORT_FAILURE:
			return `Export failed: ${ action.error.message }`;
		case EXPORT_STARTED:
			return 'Started an export';
		case HAPPYCHAT_BLUR:
			return 'Stopped looking at Happychat';
		case HAPPYCHAT_FOCUS:
			return 'Started looking at Happychat';
		case IMPORTS_IMPORT_START: // This one seems not to fire at all.
			return null;
		case JETPACK_CONNECT_AUTHORIZE:
			return null;
		case MEDIA_DELETE: // This one seems not to fire at all.
			return null;
		case PLUGIN_ACTIVATE_REQUEST:
			return null;
		case PLUGIN_SETUP_ACTIVATE:
			return null;
		case POST_SAVE_SUCCESS:
			return `Saved post "${ action.savedPost.title }" ${ action.savedPost.short_URL }`;
		case PUBLICIZE_CONNECTION_CREATE:
			return `Connected ${ action.connection.label } sharing`;
		case PUBLICIZE_CONNECTION_DELETE:
			return `Disconnected ${ action.connection.label } sharing`;
		case PURCHASE_REMOVE_COMPLETED:
			return null;
		case SITE_SETTINGS_SAVE_SUCCESS:
			return 'Saved site settings';
	}
	return null;
};

export const getEventMessageFromTracksData = ( { name, properties } ) => {
	switch ( name ) {
		case 'calypso_add_new_wordpress_click':
			return 'Clicked "Add new site" button';
		case 'calypso_domain_search_add_button_click':
			return `Clicked "Add" button to add domain "${ properties.domain_name }"`;
		case 'calypso_domain_remove_button_click':
			return `Clicked "Remove" button to remove domain "${ properties.domain_name }"`;
		case 'calypso_themeshowcase_theme_activate':
			return `Changed theme from "${ properties.previous_theme }" to "${ properties.theme }"`;
		case 'calypso_editor_featured_image_upload':
			return 'Changed the featured image on the current post';
		case 'calypso_map_domain_step_add_domain_click':
			return `Add "${ properties.domain_name }" to the cart in the "Map a domain" step`;
	}
	return null;
};

export const sendAnalyticsLogEvent = ( connection, { meta: { analytics: analyticsMeta } } ) => {
	analyticsMeta.forEach( ( { type, payload: { service, name, properties } } ) => {
		if ( type === ANALYTICS_EVENT_RECORD && service === 'tracks' ) {
			// Check if this event should generate a timeline event, and send it if so
			const eventMessage = getEventMessageFromTracksData( { name, properties } );
			if ( eventMessage ) {
				// Once we want these events to appear in production we should change this to sendEvent
				sendEvent( eventMessage );
			}

			// Always send a log for every tracks event
			sendLog( name );
		}
	} );
};

export const sendActionLogsAndEvents = ( connection, { getState }, action ) => {
	const state = getState();

	// If there's not an active Happychat session, do nothing
	if ( ! isHappychatClientConnected( state ) || ! isHappychatChatAssigned( state ) ) {
		return;
	}

	// If there's analytics metadata attached to this action, send analytics events
	if ( has( action, 'meta.analytics' ) ) {
		sendAnalyticsLogEvent( connection, action );
	}

	// Check if this action should generate a timeline event, and send it if so
	const eventMessage = getEventMessageFromActionData( action );
	if ( eventMessage ) {
		// Once we want these events to appear in production we should change this to sendEvent
		sendEvent( eventMessage );
	}
};

const getRouteSetMessage = ( { getState }, action ) => {
	const currentUser = getCurrentUser( getState );
	return `Looking at https://wordpress.com${ action.path }?support_user=${ currentUser.username }`;
};

export default function( connection = null ) {
	// Allow a connection object to be specified for
	// testing. If blank, use a real connection.
	if ( connection == null ) {
		connection = require( './common' ).connection;
	}

	return store => next => action => {
		// Send any relevant log/event data from this action to Happychat
		sendActionLogsAndEvents( connection, store, action );

		switch ( action.type ) {
			case HAPPYCHAT_CONNECT:
				connectChat( connection, store );
				break;

			case HAPPYCHAT_INITIALIZE:
				connectIfRecentlyActive( connection, store );
				break;

			// Converts Calypso action => SocketIO action
			case HELP_CONTACT_FORM_SITE_SELECT:
				const state = store.getState();
				isHappychatClientConnected( state )
					? sendPreferences( getCurrentUserLocale( state ), getGroups( state, action.siteId ) )
					: noop;
				break;

			case HAPPYCHAT_IO_SEND_MESSAGE_EVENT:
			case HAPPYCHAT_IO_SEND_MESSAGE_LOG:
			case HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE:
			case HAPPYCHAT_IO_SEND_MESSAGE_USERINFO:
			case HAPPYCHAT_IO_SEND_PREFERENCES:
			case HAPPYCHAT_IO_SEND_TYPING:
				connection.emit( action );
				break;

			case HAPPYCHAT_IO_REQUEST_TRANSCRIPT:
				connection.request( action, 10000 );
				break;

			// Converts Happychat UI action => SocketIO action
			case HAPPYCHAT_SET_MESSAGE:
				const { message } = action;
				isEmpty( message ) ? sendNotTyping() : sendThrottledTyping( message );
				break;

			// Converts Calypso action => SocketIO action
			case ROUTE_SET:
				isHappychatClientConnected( state ) && isHappychatChatAssigned( state )
					? sendEvent( getRouteSetMessage( store, action ) )
					: noop;
				break;
		}
		return next( action );
	};
}

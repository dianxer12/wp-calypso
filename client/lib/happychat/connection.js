/** @format */

/**
 * External dependencies
 */
import IO from 'socket.io-client';
import { isString } from 'lodash';

/**
 * Internal dependencies
 */
import {
	receiveAccept,
	receiveConnect,
	receiveDisconnect,
	receiveError,
	receiveInit,
	receiveMessage,
	receiveReconnecting,
	receiveStatus,
	receiveToken,
	receiveUnauthorized,
	requestChatTranscript,
} from 'state/happychat/connection/actions';

const debug = require( 'debug' )( 'calypso:happychat:connection' );

const buildConnection = socket =>
	isString( socket )
		? new IO( socket ) // If socket is an URL, connect to server.
		: socket; // If socket is not an url, use it directly. Useful for testing.

class Connection {
	/**
	 * Init the SockeIO connection: check user authorization and bind socket events
	 *
	 * @param  { Function } dispatch Redux dispatch function
	 * @param  { Promise } config   Will give us the user info
	 * @return { Promise } A promise to be resolved (returns the internal opened socket)
	 *                   	 or rejected (by the config promise or the auth socket itself)
	 */
	init( dispatch, config ) {
		if ( this.openSocket ) {
			debug( 'socket is already connected' );
			return this.openSocket;
		}
		this.dispatch = dispatch;

		return config.then(
			( { url, user: { signer_user_id, jwt, locale, groups, geo_location } } ) => {
				const socket = buildConnection( url );

				this.openSocket = new Promise( resolve => {
					// TODO: reject this promise
					socket
						.once( 'connect', () => dispatch( receiveConnect() ) )
						.on( 'token', handler => {
							dispatch( receiveToken() );
							handler( { signer_user_id, jwt, locale, groups } );
						} )
						.on( 'init', () => {
							dispatch( receiveInit( { signer_user_id, locale, groups, geo_location } ) );
							dispatch( requestChatTranscript() );
							resolve( socket );
						} )
						.on( 'unauthorized', () => {
							dispatch( receiveUnauthorized( 'User is not authorized' ) );
							socket.close();
						} )
						.on( 'disconnect', reason => dispatch( receiveDisconnect( reason ) ) )
						.on( 'reconnecting', () => dispatch( receiveReconnecting() ) )
						.on( 'status', status => dispatch( receiveStatus( status ) ) )
						.on( 'accept', accept => dispatch( receiveAccept( accept ) ) )
						.on( 'message', message => dispatch( receiveMessage( message ) ) );
				} );
			}
		);
	}

	/**
	 * Given a Redux action, emits a SocketIO event.
	 *
	 * @param  { Object } action A Redux action with props
	 *                    {
	 *                  		event: SocketIO event name,
	 *                  	  payload: contents to be sent,
	 *                  	  error: message to be shown should the event fails to be sent,
	 *                  	}
	 */
	send( action ) {
		if ( ! this.openSocket ) {
			return;
		}
		this.openSocket.then(
			socket => socket.emit( action.event, action.payload ),
			e => this.dispatch( receiveError( action.error || '' + e ) )
		);
	}

	/**
	 * Given a Redux action and a timeout, emits a SocketIO event that request
	 * some info to server as a Promise. Upon resolution of that request promise,
	 * the action.callback will be dispatched (it should be a Redux action creator).
	 * If server response takes more than timeout, the action.callbackTimeout
	 * will be dispatched instead.
	 *
	 * @param  { Object } action A Redux action with props
	 *                  	{
	 *                  		event: SocketIO event name,
	 *                  		payload: contents to be sent,
	 *                  		error: message to be shown should the event fails to be sent,
	 *                  		callback: a Redux action creator,
	 *                  		callbackTimeout: a Redux action creator,
	 *                  	}
	 * @param  { Number } timeout How long (in milliseconds) has the server to respond
	 */
	request( action, timeout ) {
		if ( ! this.openSocket ) {
			return;
		}
		this.openSocket.then( socket =>
			Promise.race( [
				new Promise( ( resolve, reject ) => {
					socket.emit( action.event, action.payload, ( e, result ) => {
						if ( e ) {
							this.dispatch( receiveError( action.error + e ) );
							return reject( new Error( e ) );
						}
						this.dispatch( action.callback( result ) );
						resolve( result );
					} );
				} ),
				new Promise( ( resolve, reject ) =>
					setTimeout( () => {
						reject( Error( 'timeout' ) );
						this.dispatch( action.callbackTimeout() );
					}, timeout )
				),
			] )
		);
	}
}

export default () => new Connection();

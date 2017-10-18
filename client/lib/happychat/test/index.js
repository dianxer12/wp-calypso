/**
 * External dependencies
 *
 * @format
 */

import { expect } from 'chai';
import { stub } from 'sinon';
import { EventEmitter } from 'events';

/**
 * Internal dependencies
 */
import {
	HAPPYCHAT_IO_RECEIVE_ACCEPT,
	HAPPYCHAT_IO_RECEIVE_DISCONNECT,
	HAPPYCHAT_IO_RECEIVE_INIT,
	HAPPYCHAT_IO_RECEIVE_MESSAGE,
	HAPPYCHAT_IO_RECEIVE_RECONNECTING,
	HAPPYCHAT_IO_RECEIVE_STATUS,
	HAPPYCHAT_IO_REQUEST_TRANSCRIPT,
} from 'state/action-types';

import buildConnection from '../connection';

describe( 'connection', () => {
	describe( 'should bind socket upon config promise resolution', () => {
		const signer_user_id = 12;
		const jwt = 'jwt';
		const locale = 'locale';
		const groups = 'groups';
		const geo_location = 'location';

		let openSocket, socket, dispatch;
		beforeEach( () => {
			socket = new EventEmitter();
			dispatch = stub();
			const connection = buildConnection();
			const config = Promise.resolve( {
				url: socket,
				user: {
					signer_user_id,
					jwt,
					locale,
					groups,
					geo_location,
				},
			} );
			openSocket = connection.init( dispatch, config );
		} );

		it( 'connect event', done => {
			openSocket.then( () => {
				// TODO: implement when connect event is used
				expect( true ).to.equal( true );
				done(); // tell mocha the promise chain ended
			} );
			socket.emit( 'connect' );
			socket.emit( 'init' ); // force openSocket promise to resolve
		} );

		it( 'token event', done => {
			const callback = stub();
			openSocket.then( () => {
				expect( callback ).to.have.been.calledWithMatch( { signer_user_id, jwt, locale, groups } );
				done(); // tell mocha the promise chain ended
			} );
			socket.emit( 'token', callback );
			socket.emit( 'init' ); // force openSocket promise to resolve
		} );

		it( 'init event', done => {
			openSocket.then( () => {
				expect( dispatch.getCall( 0 ) ).to.have.been.calledWithMatch( {
					type: HAPPYCHAT_IO_RECEIVE_INIT,
					user: { signer_user_id, locale, groups, geo_location },
				} );
				expect( dispatch.getCall( 1 ) ).to.have.been.calledWithMatch( {
					type: HAPPYCHAT_IO_REQUEST_TRANSCRIPT,
				} );
				done(); // tell mocha the promise chain ended
			} );
			socket.emit( 'init' ); // force openSocket promise to resolve
		} );

		it( 'unauthorized event', done => {
			socket.close = stub().returns( () => {} );
			openSocket.then( () => {
				expect( socket.close ).to.have.been.called;
				done(); // tell mocha the promise chain ended
			} );
			socket.emit( 'init' ); // force openSocket promise to resolve
			socket.emit( 'unauthorized' );
		} );

		it( 'disconnect event', done => {
			const error = 'testing reasons';
			openSocket.then( () => {
				expect( dispatch.getCall( 2 ) ).to.have.been.calledWithMatch( {
					type: HAPPYCHAT_IO_RECEIVE_DISCONNECT,
					error,
				} );
				done(); // tell mocha the promise chain ended
			} );
			socket.emit( 'init' ); // force openSocket promise to resolve
			socket.emit( 'disconnect', error );
		} );

		it( 'reconnecting event', done => {
			openSocket.then( () => {
				expect( dispatch.getCall( 2 ) ).to.have.been.calledWithMatch( {
					type: HAPPYCHAT_IO_RECEIVE_RECONNECTING,
				} );
				done(); // tell mocha the promise chain ended
			} );
			socket.emit( 'init' ); // force openSocket promise to resolve
			socket.emit( 'reconnecting' );
		} );

		it( 'status event', done => {
			const status = 'testing status';
			openSocket.then( () => {
				expect( dispatch.getCall( 2 ) ).to.have.been.calledWithMatch( {
					type: HAPPYCHAT_IO_RECEIVE_STATUS,
					status,
				} );
				done(); // tell mocha the promise chain ended
			} );
			socket.emit( 'init' ); // force openSocket promise to resolve
			socket.emit( 'status', status );
		} );

		it( 'accept event', done => {
			const isAvailable = true;
			openSocket.then( () => {
				expect( dispatch.getCall( 2 ) ).to.have.been.calledWithMatch( {
					type: HAPPYCHAT_IO_RECEIVE_ACCEPT,
					isAvailable,
				} );
				done(); // tell mocha the promise chain ended
			} );
			socket.emit( 'init' ); // force openSocket promise to resolve
			socket.emit( 'accept', isAvailable );
		} );

		it( 'message event', done => {
			const message = 'testing msg';
			openSocket.then( () => {
				expect( dispatch.getCall( 2 ) ).to.have.been.calledWithMatch( {
					type: HAPPYCHAT_IO_RECEIVE_MESSAGE,
					message,
				} );
				done(); // tell mocha the promise chain ended
			} );
			socket.emit( 'init' ); // force openSocket promise to resolve
			socket.emit( 'message', message );
		} );
	} );

	it( 'should not bind socket upon config promise rejection', () => {
		const config = Promise.reject();
		const connection = buildConnection();
		const dispatch = stub();
		const openSocket = connection.init( dispatch, config );
		// TODO improve how we test that init promise returned is rejected
		openSocket
			.then( () => {
				expect( false ).to.be.true;
			} )
			.catch( () => {
				expect( true ).to.be.true;
			} );
	} );
} );

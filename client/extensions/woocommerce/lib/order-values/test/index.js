/** @format */

/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import {
	getOrderDiscountTax,
	getOrderFeeTax,
	getOrderFeeTotal,
	getOrderFeeTotalTax,
	getOrderLineItemTax,
	getOrderRefundTotal,
	getOrderShippingTax,
	getOrderSubtotalTax,
	getOrderTotalTax,
} from '../index';
import orderWithTax from './fixtures/order';
import orderWithoutTax from './fixtures/order-no-tax';
import orderWithCoupons from './fixtures/order-with-coupons';
import orderWithRefunds from './fixtures/order-with-refunds';

describe( 'getOrderDiscountTax', () => {
	test( 'should be a function', () => {
		expect( getOrderDiscountTax ).to.be.a( 'function' );
	} );

	test( 'should get the correct tax amount', () => {
		expect( getOrderDiscountTax( orderWithTax ) ).to.eql( 0.95 );
	} );

	test( 'should get the correct tax amount with multiple coupons', () => {
		expect( getOrderDiscountTax( orderWithCoupons ) ).to.eql( 1.42 );
	} );

	test( 'should return 0 if there is no tax', () => {
		expect( getOrderDiscountTax( orderWithoutTax ) ).to.eql( 0 );
	} );

	test( 'should return 0 if the order is malformed', () => {
		expect( getOrderDiscountTax( {} ) ).to.eql( 0 );
	} );
} );

describe( 'getOrderFeeTax', () => {
	it( 'should be a function', () => {
		expect( getOrderFeeTax ).to.be.a( 'function' );
	} );

	it( 'should get the correct tax amount', () => {
		expect( getOrderFeeTax( orderWithTax, 0 ) ).to.eql( 0.1262 );
	} );

	it( 'should get the correct tax amount with multiple fees', () => {
		expect( getOrderFeeTax( orderWithCoupons, 1 ) ).to.eql( 0.625 );
	} );

	it( 'should return 0 if there is no tax', () => {
		expect( getOrderFeeTax( orderWithoutTax, 0 ) ).to.eql( 0 );
	} );
} );

describe( 'getOrderFeeTotalTax', () => {
	it( 'should be a function', () => {
		expect( getOrderFeeTotalTax ).to.be.a( 'function' );
	} );

	it( 'should get the correct tax amount', () => {
		expect( getOrderFeeTotalTax( orderWithTax ) ).to.eql( 0.1262 );
	} );

	it( 'should get the correct tax amount with multiple fees', () => {
		expect( getOrderFeeTotalTax( orderWithCoupons ) ).to.eql( 0.9375 );
	} );

	it( 'should return 0 if there is no tax', () => {
		expect( getOrderFeeTotalTax( orderWithoutTax ) ).to.eql( 0 );
	} );
} );

describe( 'getOrderLineItemTax', () => {
	test( 'should be a function', () => {
		expect( getOrderLineItemTax ).to.be.a( 'function' );
	} );

	test( 'should get the correct tax amount', () => {
		expect( getOrderLineItemTax( orderWithTax, 15 ) ).to.eql( 5.3964 );
	} );

	test( 'should get the correct tax amount for the second item', () => {
		expect( getOrderLineItemTax( orderWithTax, 19 ) ).to.eql( 1.1424 );
	} );

	test( 'should return 0 if there is no tax', () => {
		expect( getOrderLineItemTax( orderWithoutTax, 1 ) ).to.eql( 0 );
	} );

	test( 'should get the correct tax amount for an item with multiple coupons', () => {
		expect( getOrderLineItemTax( orderWithCoupons, 27 ) ).to.eql( 2.3109 );
	} );
} );

describe( 'getOrderShippingTax', () => {
	test( 'should be a function', () => {
		expect( getOrderShippingTax ).to.be.a( 'function' );
	} );

	test( 'should get the correct tax amount', () => {
		expect( getOrderShippingTax( orderWithTax ) ).to.eql( 0.635 );
	} );

	test( 'should return 0 if there is no tax', () => {
		expect( getOrderShippingTax( orderWithoutTax ) ).to.eql( 0 );
	} );

	test( 'should get the correct tax amount with multiple coupons', () => {
		expect( getOrderShippingTax( orderWithCoupons ) ).to.eql( 0.635 );
	} );
} );

describe( 'getOrderSubtotalTax', () => {
	test( 'should be a function', () => {
		expect( getOrderSubtotalTax ).to.be.a( 'function' );
	} );

	test( 'should get the correct tax amount', () => {
		expect( getOrderSubtotalTax( orderWithTax ) ).to.eql( 6.5388 );
	} );

	test( 'should return 0 if there is no tax', () => {
		expect( getOrderSubtotalTax( orderWithoutTax ) ).to.eql( 0 );
	} );

	test( 'should get the correct tax amount with multiple coupons', () => {
		expect( getOrderSubtotalTax( orderWithCoupons ) ).to.eql( 3.7893 );
	} );
} );

describe( 'getOrderTotalTax', () => {
	test( 'should be a function', () => {
		expect( getOrderTotalTax ).to.be.a( 'function' );
	} );

	it( 'should get the correct tax amount', () => {
		expect( getOrderTotalTax( orderWithTax ) ).to.eql( 7.3 );
	} );

	test( 'should return 0 if there is no tax', () => {
		expect( getOrderTotalTax( orderWithoutTax ) ).to.eql( 0 );
	} );

	it( 'should get the correct tax amount with multiple coupons', () => {
		expect( getOrderTotalTax( orderWithCoupons ) ).to.eql( 5.3618 );
	} );
} );

describe( 'getOrderFeeTotal', () => {
	it( 'should be a function', () => {
		expect( getOrderFeeTotal ).to.be.a( 'function' );
	} );

	it( 'should get the correct tax amount', () => {
		expect( getOrderFeeTotal( orderWithTax ) ).to.eql( 1.53 );
	} );

	it( 'should get the correct tax amount with multiple fees', () => {
		expect( getOrderFeeTotal( orderWithCoupons ) ).to.eql( 15 );
	} );

	it( 'should return 0 if there is no tax', () => {
		expect( getOrderFeeTotal( orderWithoutTax ) ).to.eql( 20 );
	} );
} );

describe( 'getOrderRefundTotal', () => {
	it( 'should be a function', () => {
		expect( getOrderRefundTotal ).to.be.a( 'function' );
	} );

	it( 'should get the correct refund amount', () => {
		expect( getOrderRefundTotal( orderWithCoupons ) ).to.eql( -10.0 );
	} );

	it( 'should return 0 if there are no refunds', () => {
		expect( getOrderRefundTotal( orderWithoutTax ) ).to.eql( 0 );
	} );

	it( 'should get the correct refund amount with multiple refunds', () => {
		expect( getOrderRefundTotal( orderWithRefunds ) ).to.eql( -25.0 );
	} );
} );

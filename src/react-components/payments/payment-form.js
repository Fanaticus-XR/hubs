import React, { useState } from 'react';

import { SquarePaymentsForm, CreditCardInput } from 'react-square-web-payments-sdk';

export function ensureNewHubPaymentProcessed(name, sceneId, replace) {
    return new Promise((resolve, reject) => {
        const payment = { processed: false, message: 'just doing a thing for testing...TODO check status, and show PaymentForm if necessary'};
        resolve(payment)
    });
}

export function PaymentForm(props) { // TODO make this modal and likely following the pattern/impl of SignInModal or the like will be good
    const [isShowing, setIsShowing] = useState(props.isShowing);

    return (isShowing &&
        <SquarePaymentsForm
            /**
             * Identifies the calling form with a verified application ID
             * generated from the Square Application Dashboard.
             */
            applicationId="sandbox-sq0idb-uR-6LAA4fOZydC5rtwI_qA"
            /**
             * Invoked when payment form receives the result of a tokenize generation request.
             * The result will be a valid credit card or wallet token, or an error.
             */
            cardTokenizeResponseReceived={(token, buyer) => {
                console.info({ token, buyer });
                if (props.cardTokenizeResponseReceived) {
                    props.cardTokenizeResponseReceived(token, buyer);
                }
            }}
            /**
             * This function enable the Strong Customer Authentication (SCA) flow
             *
             * We strongly recommend use this function to verify the buyer and
             * reduce the chance of fraudulent transactions.
             */
            createVerificationDetails={() => ({
                amount: '1.00',
                /* collected from the buyer */
                billingContact: {
                    addressLines: ['123 Main Street', 'Apartment 1'],
                    familyName: 'Doe',
                    givenName: 'John',
                    countryCode: 'US',
                    city: 'Atlanta',
                },
                currencyCode: 'USD',
                intent: 'CHARGE',
            })}
            /**
             * Identifies the location of the merchant that is taking the payment.
             * Obtained from the Square Application Dashboard - Locations tab.
             */
            locationId="LK32GBMBWZTWC"
            >
        <CreditCardInput />
    </SquarePaymentsForm>
    );
}
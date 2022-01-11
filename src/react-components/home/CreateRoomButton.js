import React from "react";
import { FormattedMessage } from "react-intl";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { Button } from "../input/Button";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import PaymentForm from "../payments/payment-form"

export function CreateRoomButton() {
  const breakpoint = useCssBreakpoints();

  return (
    <Button
      lg={breakpoint === "sm" || breakpoint === "md"}
      xl={breakpoint !== "sm" && breakpoint !== "md"}
      preset="primary"
      onClick={e => {
        e.preventDefault();

        // TODO do this after paymennt accepted: createAndRedirectToNewHub(null, null, false);
      }}
    >
      <FormattedMessage id="create-room-button" defaultMessage="Create Room" />
    </Button> && 
    <PaymentForm cardTokenizeResponseReceived={(token, buyer) => {
      if (token.status == 'OK') {
        console.log('Transaction approved');
      } else {
        console.log('Transaction error');
      }
    }} />
  );
}

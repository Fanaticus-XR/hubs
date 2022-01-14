import React, { useState } from "react";
import { Container } from "../layout/Container";
import { FormattedMessage } from "react-intl";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { Button } from "../input/Button";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import { ensureNewHubPaymentProcessed, PaymentForm } from "../payments/payment-form"

export function CreateRoomButton(props) {
  const [isPaymentFormShowing, setIsPaymentFormShowing] = useState(props.isPaymentFormShowing);
  const breakpoint = useCssBreakpoints();

  return (
    <Container>
      <Button
        lg={breakpoint === "sm" || breakpoint === "md"}
        xl={breakpoint !== "sm" && breakpoint !== "md"}
        preset="primary"
        onClick={e => {
          e.preventDefault();
          createAndRedirectToNewHub(null, null, false, async (name, sceneId, replace) => {
            setIsPaymentFormShowing(true)
            const payment = await ensureNewHubPaymentProcessed(name, sceneId, replace);
            return {ok:payment.processed};
          });
        }}
      >
        <FormattedMessage id="create-room-button" defaultMessage="Create Room" />
      </Button>
      {isPaymentFormShowing && <PaymentForm cardTokenizeResponseReceived={(token, buyer) => {
        if (token.status == 'OK') {
          console.log('Transaction approved');
          setIsPaymentFormShowing(false)
        } else {
          console.log('Transaction error');
        }
      }}/>}
    </Container>
  );
}

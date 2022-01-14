import React, { useState, useCallback } from "react";
import { Container } from "../layout/Container";
import { FormattedMessage } from "react-intl";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { Button } from "../input/Button";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import { PaymentForm } from "../payments/payment-form"

async function sleepUntil(f, timeoutMs) {
  return new Promise((resolve, reject) => {
      let timeWas = new Date();
      let wait = setInterval(function() {
          if (f()) {
              console.log("resolved after", new Date() - timeWas, "ms");
              clearInterval(wait);
              resolve();
          } else if (new Date() - timeWas > timeoutMs) { // Timeout
              console.log("rejected after", new Date() - timeWas, "ms");
              clearInterval(wait);
              reject();
          }
      }, 20);
  });
}

export function CreateRoomButton(props) {
  const [isPaymentFormShowing, setIsPaymentFormShowing] = useState(props.isPaymentFormShowing);
  const [paymentContext, setPaymentContext] = useState({token:void 0, buyer: void 0});
  const breakpoint = useCssBreakpoints();
  
  const memoized_ensureNewHubPaymentProcessed = useCallback(
    async (name, sceneId, replace) => {
      await sleepUntil(() => { return paymentContext.token }, 20000)
      .finally(() => console.log(paymentContext))
    },
    [], // Tells React to memoize regardless of arguments.
  );

  const memoized_cardTokenizeResponseReceived = useCallback(
    (token, buyer) => {
      paymentContext.token = token;
      paymentContext.buyer = buyer;
      setPaymentContext(paymentContext)
  
      if (token.status == 'OK') {
        console.log('Transaction approved');
        console.log(paymentContext)
        setIsPaymentFormShowing(false)
      } else {
        console.log('Transaction error');
      }
    },
    [], // Tells React to memoize regardless of arguments.
  );

  const memoized_onClick = useCallback(
    e => {
      e.preventDefault();
      createAndRedirectToNewHub(null, null, false, async (name, sceneId, replace) => {
        setIsPaymentFormShowing(true)
        console.log('will await that to resolve or reject????')
        await memoized_ensureNewHubPaymentProcessed(name, sceneId, replace);
        console.log('arent i supposed to be awaiting that to resolve or reject????')
        return {ok:paymentContext.token.status == 'OK'} // TODO maybe better to instead reject if not payment.processed...yeah
      });
    },
    [], // Tells React to memoize regardless of arguments.
  );

  return (
    <Container>
      {!isPaymentFormShowing && <Button
        lg={breakpoint === "sm" || breakpoint === "md"}
        xl={breakpoint !== "sm" && breakpoint !== "md"}
        preset="primary"
        onClick={memoized_onClick}
      >
        <FormattedMessage id="create-room-button" defaultMessage="Create Room" />
      </Button>}
      {isPaymentFormShowing && <PaymentForm cardTokenizeResponseReceived={memoized_cardTokenizeResponseReceived}/>}
    </Container>
  );
}

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
  
  async function ensureNewHubPaymentProcessed(name, sceneId, replace) {
      await sleepUntil(() => { return paymentContext.token }, 20000)
      .finally(() => console.log(paymentContext))
    }

  function cardTokenizeResponseReceived(token, buyer) {
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
    }

  function onClick(e) {
      e.preventDefault();
      createAndRedirectToNewHub(null, null, false, async (name, sceneId, replace) => {
        setIsPaymentFormShowing(true)
        console.log('will await that to resolve or reject????')
        await ensureNewHubPaymentProcessed(name, sceneId, replace);
        console.log('arent i supposed to be awaiting that to resolve or reject????')
        return {ok:paymentContext.token.status == 'OK'} // TODO maybe better to instead reject if not payment.processed...yeah
      });
    }

  return (
    <Container>
      {!isPaymentFormShowing && <Button
        lg={breakpoint === "sm" || breakpoint === "md"}
        xl={breakpoint !== "sm" && breakpoint !== "md"}
        preset="primary"
        onClick={onClick}
      >
        <FormattedMessage id="create-room-button" defaultMessage="Create Room" />
      </Button>}
      {isPaymentFormShowing && <PaymentForm cardTokenizeResponseReceived={cardTokenizeResponseReceived}/>}
    </Container>
  );
}

import React, { useState } from "react";
import { Container } from "../layout/Container";
import { FormattedMessage } from "react-intl";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { Button } from "../input/Button";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import { PaymentForm } from "../payments/payment-form"

async function sleepUntil(condition, timeoutMs) {
  return new Promise((resolve, reject) => {
      let start = new Date();
      let wait = setInterval(function() {
          if (condition()) {
              clearInterval(wait);
              resolve();
          } else if (new Date() - start > timeoutMs) {
              clearInterval(wait);
              reject();
          }
      }, 20);
  });
}

export function CreateRoomButton(props) {
  const [isPaymentFormShowing, setIsPaymentFormShowing] = useState(props.isPaymentFormShowing);
  const [postPaymentMsg, setPostPaymentMsg] = useState('');
  const [paymentContext, setPaymentContext] = useState({token:void 0, buyer: void 0});
  const breakpoint = useCssBreakpoints();
  
  async function ensureNewHubPaymentProcessed(name, sceneId, replace) {
    await sleepUntil(() => { return paymentContext.token }, 30000)
  }

  function setPaymentContext_Easy(token, buyer) {
    paymentContext.token = token
    paymentContext.buyer = buyer
    setPaymentContext(paymentContext)
  }

  function cardTokenizeResponseReceived(token, buyer) {
    setPaymentContext_Easy(token, buyer) // NOTE: this allows ensureNewHubPaymentProcessed to return positively before timeout
  }

  function getErrorMsgs(errorAr) {
    if (!errorAr) return ''
    let msg=''
    errorAr.forEach(error => msg += (typeof error == 'string' ? error : error.message) + ', ')
    return msg
  }

  function onClick(e) {
    e.preventDefault()
    setPostPaymentMsg('')
    createAndRedirectToNewHub(null, null, false, async (name, sceneId, replace) => {
      setIsPaymentFormShowing(true)
      await ensureNewHubPaymentProcessed(name, sceneId, replace);
      return {ok:paymentContext.token && paymentContext.token.status == 'OK', errors:paymentContext.token ? paymentContext.token.errors : void 0}
    })
    .then(val => {
      setIsPaymentFormShowing(false)
      let errors = getErrorMsgs(val.errors)
      if (errors == '' && val.ok == 'OK') {
        // TODO grey out 'Create Room' button to disallow interacting with it
        setPostPaymentMsg('Payment successful.  Please wait a moment while your new room is created and loaded.')
      } else {
        setPostPaymentMsg('Payment FAILED.  Please try again.  Errors: ' + errors)
      }
    })
    .catch(val => {
      setIsPaymentFormShowing(false)
      // TODO if Square does not do it automatically, mention why failed and to re-enter or show 'Cancel' button
      setPostPaymentMsg('Payment FAILED with status: ' + (paymentContext.token ? paymentContext.token.status : '<no token, nor status>. Timeout likely. Please try again.'))
    })
    .finally(() =>
      setPaymentContext_Easy(void 0, void 0) // reset essentially to allow another attempt, if failed, or just no need to keep it here anyway
    );
  }

  return (
    <Container>
      {isPaymentFormShowing && <FormattedMessage id="entery-payment-details" defaultMessage="Ability to Create Room requires payment.  Please enter your payment information and click 'Pay' to proceed."/>}
      {!isPaymentFormShowing && <Button
        lg={breakpoint === "sm" || breakpoint === "md"}
        xl={breakpoint !== "sm" && breakpoint !== "md"}
        preset="primary"
        onClick={onClick}
      >
        <FormattedMessage id="create-room-button" defaultMessage="Create Room" />
      </Button>}
      {isPaymentFormShowing && <PaymentForm cardTokenizeResponseReceived={cardTokenizeResponseReceived}/>}
      {postPaymentMsg}
    </Container>
  );
}

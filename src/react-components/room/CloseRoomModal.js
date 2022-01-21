import React, { useState, useCallback } from "react";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { CloseButton } from "../input/CloseButton";
import { Button, CancelButton } from "../input/Button";
import { Column } from "../layout/Column";
import { TextInputField } from "../input/TextInputField";

export function CloseRoomModal({ roomName, onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState("");
  const [showIsNotMatchError, setShowIsNotMatchError] = useState(false);

  const onClickConfirm = useCallback(
    () => {
      if (confirmText.toLowerCase() === roomName.toLowerCase()) {
        onConfirm();
      } else {
        setShowIsNotMatchError(true);
      }
    },
    [onConfirm, confirmText, roomName]
  );

  return (
    <Modal
      title={<FormattedMessage id="close-room-modal.title" defaultMessage="Exit Planet" />}
      beforeTitle={<CloseButton onClick={onClose} />}
    >
      <Column padding center centerMd="both" grow>
        <p>
          <FormattedMessage
            id="close-room-modal.message"
            defaultMessage="Exiting this panet will remove yourself and others from the planet, shutting it down permanently.{linebreak}Are you sure? This action cannot be undone."
            values={{ linebreak: <br /> }}
          />
        </p>
        <p>
          <FormattedMessage
            id="close-room-modal.type-to-confirm"
            defaultMessage="Type planet name to confirm: {roomName}"
            values={{ roomName: <b>{roomName}</b> }}
          />
        </p>
        <TextInputField
          label={<FormattedMessage id="close-room-modal.confirm-room-name-field" defaultMessage="Confirm Planet Name" />}
          onChange={e => setConfirmText(e.target.value)}
          value={confirmText}
          error={
            showIsNotMatchError && (
              <FormattedMessage id="close-room-modal.room-name-match-error" defaultMessage="Planet name does not match" />
            )
          }
        />
        <Button preset="accept" onClick={onClickConfirm}>
          <FormattedMessage id="close-room-modal.confirm" defaultMessage="Yes, Exit Planet" />
        </Button>
        <CancelButton onClick={onClose} />
      </Column>
    </Modal>
  );
}

CloseRoomModal.propTypes = {
  roomName: PropTypes.string,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func
};

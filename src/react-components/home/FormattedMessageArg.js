import React from 'react';
import { FormattedMessage } from 'react-intl';

// temporary work-around (see https://github.com/yahoo/babel-plugin-react-intl/issues/119)
function FormattedMessageArg(props) {
  return <FormattedMessage {...props} />;
}

export default FormattedMessageArg;
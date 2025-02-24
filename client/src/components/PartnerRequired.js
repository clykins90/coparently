import React from 'react';
import { Link } from 'react-router-dom';

function PartnerRequired() {
  return (
    <div className="partner-required">
      <h3>Partner Required</h3>
      <p>This feature requires a linked partner to use.</p>
      <p>You can invite your partner to join and link with you:</p>
      <Link to="/link-partner" className="invite-button">
        Invite Partner
      </Link>
    </div>
  );
}

export default PartnerRequired; 
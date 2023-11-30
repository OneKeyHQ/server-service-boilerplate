export type IGoplusHostUrlSecurity = {
  phishingInfo?: IGoplusPhishingSiteResponse;
  isWhiteList?: boolean;
  isBlackList?: boolean;
};

export type IGoplusHostDappSecurity = {
  dappSecurityInfo?: object;
};

export type IGoplusPhishingSiteResponse = {
  website_contract_security?: [string];
  phishing_site?: number;
};

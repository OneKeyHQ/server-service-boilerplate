import { MidwayHttpError } from '@midwayjs/core';

export class OneKeyError extends MidwayHttpError {
  constructor(i18nKey = 'error__common_unknown', code = 30001) {
    super(i18nKey, code);
  }
}

export class InvalidSignatureError extends OneKeyError {
  constructor() {
    super('error__service_ln_invalid_signature');
  }
}

export class FailedCreateUserError extends OneKeyError {
  constructor() {
    super('error__service_ln_failed_to_create_lightning_network_account');
  }
}

import fetch from 'node-fetch';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const endpoints = {
  sandbox: {
    token: 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
    pay: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay',
    status: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order'
  },
  production: {
    token: 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
    pay: 'https://api.phonepe.com/apis/pg/checkout/v2/pay',
    status: 'https://api.phonepe.com/apis/pg/checkout/v2/order'
  }
};

let cachedToken = null;
let tokenExpiresAt = 0;

const getBaseUrls = () => endpoints[env.phonepeEnv === 'production' ? 'production' : 'sandbox'];

const ensurePhonePeConfig = () => {
  if (!env.phonepeClientId || !env.phonepeClientSecret || !env.phonepeRedirectUrl) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'PhonePe environment variables are missing');
  }
};

const getAuthorizationToken = async () => {
  ensurePhonePeConfig();

  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const body = new URLSearchParams({
    client_id: env.phonepeClientId,
    client_version: env.phonepeClientVersion,
    client_secret: env.phonepeClientSecret,
    grant_type: 'client_credentials'
  });

  const response = await fetch(getBaseUrls().token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new ApiError(StatusCodes.BAD_GATEWAY, data.message || 'Unable to authenticate with PhonePe');
  }

  cachedToken = data.access_token;
  tokenExpiresAt = (data.expires_at || Math.floor(Date.now() / 1000) + 3600) * 1000;
  return cachedToken;
};

export const phonepeService = {
  async createPaymentSession({ merchantOrderId, amountInPaisa }) {
    const token = await getAuthorizationToken();
    const payload = {
      merchantOrderId,
      amount: amountInPaisa,
      expireAfter: 1200,
      paymentFlow: {
        type: 'PG_CHECKOUT',
        merchantUrls: {
          redirectUrl: `${env.phonepeRedirectUrl}?merchantOrderId=${merchantOrderId}`
        }
      },
      metaInfo: {
        udf1: merchantOrderId
      }
    };

    const response = await fetch(getBaseUrls().pay, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `O-Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.redirectUrl) {
      throw new ApiError(StatusCodes.BAD_GATEWAY, data.message || 'PhonePe payment initiation failed', data);
    }

    return data;
  },

  async getPaymentStatus(merchantOrderId) {
    const token = await getAuthorizationToken();
    const response = await fetch(`${getBaseUrls().status}/${merchantOrderId}/status?details=false`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `O-Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(StatusCodes.BAD_GATEWAY, data.message || 'Unable to fetch PhonePe payment status', data);
    }

    return data;
  }
};

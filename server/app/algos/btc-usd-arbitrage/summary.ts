import { Fee } from '../../../lib/fee';
import { ExecutionContext } from '../btc-usd-arbitrage';

interface Leg {
  price: string;
  quantity: string;
  grossTotal: string;
  feeTrade: string;
  feeWithdraw: string;
  netTotal: string;
}

export interface Summary {
  version: number;
  shortLeg: Leg;
  longLeg: Leg;
  pegLeg: {
    price: string;
    unitFeeExchange: string;
    unitFeeIof: string;
    longTotal: string;
    buyUsd: string;
  };
  pAndL: {
    usd: string;
    brl: string;
    spread: string;
    targetReached: boolean;
  };
}

function getRate(fee: Maybe<Fee>): number {
  if (!fee) {
    throw new Error('Missing fee');
  }

  return fee.rate;
}

export function summary(ctx: ExecutionContext): Summary {
  const { quantityShort, quantityLong } = ctx;
  const shortPrice = ctx.shortBestOffer[1];
  const shortGross = quantityShort * shortPrice;
  const shortFees = ctx.fees.short;
  const shortFeeTrade = shortGross * getRate(shortFees['trade-taker']);
  const shortFeeWithdraw = shortGross * getRate(shortFees['withdraw-brl']);
  const shortNet = shortGross - shortFeeTrade - shortFeeWithdraw;

  const longPrice = ctx.longBestOffer[1];
  const longGross = quantityLong * longPrice;
  const longFees = ctx.fees.long;
  const longFeeTrade = longGross * getRate(longFees['trade-taker']);
  const longFeeWithdraw = longGross * getRate(longFees['withdraw-btc']);
  const longNet = longGross + longFeeTrade;

  const pegPrice = ctx.pegPrice;
  const pegFees = ctx.fees.peg;
  const pegFeeIof = shortNet * getRate(pegFees.iof);
  const pegShortTotal = shortNet - pegFeeIof;
  const pegLongTotal = shortGross - shortFeeWithdraw;

  const pegRawPrice = ctx.pegPrice / (1 + getRate(pegFees.iof));
  const pegUnitFeeExchange = pegRawPrice * getRate(pegFees.exchange);
  const pegUnitFeeIof = ctx.pegPrice * getRate(pegFees.iof);
  const pegNetPrice = pegRawPrice + pegUnitFeeExchange + pegUnitFeeIof;
  const pegBuyUsd = shortGross / pegPrice;

  const pAndLUsd = (pegShortTotal / pegPrice) - longNet;
  const pAndLBrl = pAndLUsd * pegPrice;
  const pAndLSpread = pAndLBrl / shortNet;
  const pAndLTargetReached = pAndLSpread > ctx.parameters.targetSpread;
  const decimalsLength = 4;
  return {
    version: 2,
    shortLeg: {
      quantity: quantityShort.toFixed(8),
      price: shortPrice.toFixed(2),
      grossTotal: shortGross.toFixed(2),
      feeTrade: shortFeeTrade.toFixed(2),
      feeWithdraw: shortFeeWithdraw.toFixed(2),
      netTotal: shortNet.toFixed(2),
    },
    longLeg: {
      quantity: quantityLong.toFixed(8),
      price: longPrice.toFixed(decimalsLength),
      grossTotal: longGross.toFixed(decimalsLength),
      feeTrade: longFeeTrade.toFixed(decimalsLength),
      feeWithdraw: longFeeWithdraw.toFixed(decimalsLength),
      netTotal: longNet.toFixed(decimalsLength),
    },
    pegLeg: {
      price: pegNetPrice.toFixed(decimalsLength),
      unitFeeExchange: pegUnitFeeExchange.toFixed(2),
      unitFeeIof: pegUnitFeeIof.toFixed(2),
      longTotal: pegLongTotal.toFixed(decimalsLength),
      buyUsd: pegBuyUsd.toFixed(decimalsLength),
    },
    pAndL: {
      usd: pAndLUsd.toFixed(decimalsLength),
      brl: pAndLBrl.toFixed(decimalsLength),
      spread: `${(pAndLSpread * 100).toFixed(decimalsLength)}%`,
      targetReached: pAndLTargetReached,
    },
  };
}

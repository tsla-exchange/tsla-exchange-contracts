// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import 'synthetix/contracts/interfaces/IERC20.sol';
import 'synthetix/contracts/interfaces/IExchanger.sol';
import 'synthetix/contracts/interfaces/ISynthetix.sol';

import './ISwaps.sol';

contract TSLAExchange {
  // tokens
  address private constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
  address private constant SUSD = 0x57Ab1ec28D129707052df4dF418D58a2D46d5f51;
  address private constant STSLA = 0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D;
  // synthetix
  address private constant SNX = 0x97767D7D04Fd0dB0A1a2478DCd4BA85290556B48;
  address private constant EXCHANGER = 0x0bfDc04B38251394542586969E2356d0D731f7DE;
  // curve
  address private constant SWAPS = 0xD1602F68CC7C4c7B59D686243EA35a9C73B0c6a2;

  constructor () {
    IERC20(USDC).approve(SWAPS, type(uint).max);
  }

  function exchange (
    uint amount,
    uint susdMin
  ) external returns (uint, uint) {
    IERC20(USDC).transferFrom(msg.sender, address(this), amount);

    uint susd = ISwaps(SWAPS).exchange_with_best_rate(
      USDC,
      SUSD,
      amount,
      susdMin,
      msg.sender
    );

    IExchanger(EXCHANGER).settle(msg.sender, 'sUSD');

    uint stsla = ISynthetix(SNX).exchangeOnBehalf(
      msg.sender,
      'sUSD',
      susd / 2,
      'sTSLA'
    );

    return (susd, stsla);
  }
}

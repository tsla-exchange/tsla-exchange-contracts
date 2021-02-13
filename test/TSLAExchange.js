const { expect } = require('chai');

const UNISWAP_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const DELEGATE_APPROVALS = '0x15fd6e554874B9e70F832Ed37f231Ac5E142362f';
const SWAPS = '0xD1602F68CC7C4c7B59D686243EA35a9C73B0c6a2';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const STSLA = '0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D';

describe('TSLAExchange', function () {
  let delegateApprovals;
  let usdc;
  let stsla;

  let signer;
  let instance;

  before(async function () {
    usdc = await ethers.getContractAt('IERC20', USDC);
    stsla = await ethers.getContractAt('IERC20', STSLA);
    delegateApprovals = await ethers.getContractAt('IDelegateApprovals', DELEGATE_APPROVALS);

    [signer] = await ethers.getSigners();
    let uniswapRouter = await ethers.getContractAt('IUniswapV2Router02', UNISWAP_ROUTER);

    uniswapRouter.connect(signer).swapExactETHForTokens(
      ethers.constants.Zero,
      [await uniswapRouter.callStatic.WETH(), USDC],
      signer.address,
      ethers.constants.MaxUint256,
      { value: ethers.utils.parseEther('1000') }
    );
  });

  beforeEach(async function () {
    const factory = await ethers.getContractFactory('TSLAExchange');
    instance = await factory.deploy();
    await instance.deployed();
  });

  describe('constructor', function () {
    it('approves Curve to spend USDC', async function () {
      expect(
        await usdc.callStatic.allowance(instance.address, SWAPS)
      ).to.equal(
        ethers.constants.MaxUint256
      );
    });
  });

  describe('#exchange', function () {
    it('returns sUSD and sTSLA outputs', async function () {
      const amount = ethers.BigNumber.from('1000000000');
      await usdc.approve(instance.address, ethers.constants.MaxUint256);
      await delegateApprovals.approveExchangeOnBehalf(instance.address);

      const [susd, stsla] = await instance.callStatic.exchange(amount, ethers.constants.Zero);

      expect(susd).to.equal('986024346725145854844');
      expect(stsla).to.equal('1208633553837700453');
    });

    it('decreases USDC balance of sender', async function () {
      const amount = ethers.BigNumber.from('1000000000');
      await usdc.approve(instance.address, ethers.constants.MaxUint256);
      await delegateApprovals.approveExchangeOnBehalf(instance.address);

      await expect(
        () => instance.exchange(amount, ethers.constants.Zero)
      ).to.changeTokenBalance(
        usdc,
        signer,
        ethers.constants.Zero.sub(amount)
      );
    });

    it('increases sTSLA balance of sender', async function () {
      const amount = ethers.BigNumber.from('1000000000');
      await usdc.approve(instance.address, ethers.constants.MaxUint256);
      await delegateApprovals.approveExchangeOnBehalf(instance.address);

      await expect(
        () => instance.exchange(amount, ethers.constants.Zero)
      ).to.changeTokenBalance(
        stsla,
        signer,
        ethers.BigNumber.from('1208631393697978875')
      );
    });

    describe('reverts if', function () {
      it('contract is not approved to spend USDC', async function () {
        await expect(
          instance.exchange(ethers.constants.One, ethers.constants.Zero)
        ).to.be.revertedWith(
          'ERC20: transfer amount exceeds allowance'
        );
      });

      it('received sUSD is less than given minimum', async function () {
        await usdc.approve(instance.address, ethers.constants.MaxUint256);

        const amount = ethers.BigNumber.from('1000000000');

        await expect(
          instance.exchange(amount, amount)
        ).to.be.reverted;
      });

      it('contract is not approved to exchange on Synthetix', async function () {
        await usdc.approve(instance.address, ethers.constants.MaxUint256);

        await expect(
          instance.exchange(ethers.constants.One, ethers.constants.Zero)
        ).to.be.revertedWith(
          'Not approved to act on behalf'
        );
      });
    });
  });
});

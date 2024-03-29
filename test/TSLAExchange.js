const { expect } = require('chai');

const UNISWAP_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const DELEGATE_APPROVALS = '0x15fd6e554874B9e70F832Ed37f231Ac5E142362f';
const SWAPS = '0xD1602F68CC7C4c7B59D686243EA35a9C73B0c6a2';
const BPOOL = '0x055dB9AFF4311788264798356bbF3a733AE181c6';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const SUSD = '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51';
const STSLA = '0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D';
const SYSTEM_STATUS = '0x1c86B3CDF2a60Ae3a574f7f71d44E2C50BDdB87E';

describe('TSLAExchange', function () {
  let delegateApprovals;
  let usdc;
  let susd;
  let stsla;

  let signer;
  let instance;

  before(async function () {
    usdc = await ethers.getContractAt('IERC20', USDC);
    susd = await ethers.getContractAt('IERC20', SUSD);
    stsla = await ethers.getContractAt('IERC20', STSLA);
    delegateApprovals = await ethers.getContractAt('IDelegateApprovals', DELEGATE_APPROVALS);

    [signer] = await ethers.getSigners();
    const uniswapRouter = await ethers.getContractAt('IUniswapV2Router02', UNISWAP_ROUTER);

    await uniswapRouter.connect(signer).swapExactETHForTokens(
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

    it('approves Balancer to spend sUSD', async function () {
      expect(
        await susd.callStatic.allowance(instance.address, BPOOL)
      ).to.equal(
        ethers.constants.MaxUint256
      );
    });
  });

  describe('#exchange', function () {
    describe('during trading hours', function () {
      it('returns sUSD and sTSLA outputs', async function () {
        const amount = ethers.BigNumber.from('1000000000');
        await usdc.approve(instance.address, ethers.constants.MaxUint256);
        await delegateApprovals.approveExchangeOnBehalf(instance.address);

        const [susdBalance, stslaBalance] = await instance.callStatic.exchange(
          amount,
          ethers.constants.Zero,
          ethers.constants.Zero
        );

        expect(susdBalance).to.equal('986024346725145854844');
        expect(stslaBalance).to.equal('1208633553837700453');
      });

      it('decreases USDC balance of sender', async function () {
        const amount = ethers.BigNumber.from('1000000000');
        await usdc.approve(instance.address, ethers.constants.MaxUint256);
        await delegateApprovals.approveExchangeOnBehalf(instance.address);

        await expect(
          () => instance.exchange(
            amount,
            ethers.constants.Zero,
            ethers.constants.Zero
          )
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
          () => instance.exchange(
            amount,
            ethers.constants.Zero,
            ethers.constants.Zero
          )
        ).to.changeTokenBalance(
          stsla,
          signer,
          ethers.BigNumber.from('1208631393697978875')
        );
      });

      it('leaves no tokens locked in contract', async function () {
        const amount = ethers.BigNumber.from('1000000000');
        await usdc.approve(instance.address, ethers.constants.MaxUint256);
        await delegateApprovals.approveExchangeOnBehalf(instance.address);

        await instance.callStatic.exchange(
          amount,
          ethers.constants.Zero,
          ethers.constants.Zero
        );

        expect(
          await usdc.callStatic.balanceOf(instance.address)
        ).to.equal(
          ethers.constants.Zero
        );

        expect(
          await susd.callStatic.balanceOf(instance.address)
        ).to.equal(
          ethers.constants.Zero
        );

        expect(
          await stsla.callStatic.balanceOf(instance.address)
        ).to.equal(
          ethers.constants.Zero
        );
      });

      describe('reverts if', function () {
        it('contract is not approved to spend USDC', async function () {
          await expect(
            instance.exchange(
              ethers.constants.One,
              ethers.constants.Zero,
              ethers.constants.Zero
            )
          ).to.be.revertedWith(
            'ERC20: transfer amount exceeds allowance'
          );
        });

        it('received sUSD is less than given minimum', async function () {
          await usdc.approve(instance.address, ethers.constants.MaxUint256);
          await delegateApprovals.approveExchangeOnBehalf(instance.address);

          await expect(
            instance.exchange(
              ethers.utils.parseUnits('1', 6),
              ethers.utils.parseUnits('1', 18),
              ethers.constants.Zero
            )
          ).to.be.reverted;
        });

        it('contract is not approved to exchange on Synthetix', async function () {
          await usdc.approve(instance.address, ethers.constants.MaxUint256);

          await expect(
            instance.exchange(
              ethers.constants.One,
              ethers.constants.Zero,
              ethers.constants.Zero
            )
          ).to.be.revertedWith(
            'Not approved to act on behalf'
          );
        });
      });
    });

    describe('after hours', function () {
      before(async function () {
        await ethers.provider.send('evm_mine', [1613371823]);
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: ['0xC105Ea57Eb434Fbe44690d7Dec2702e4a2FBFCf7'],
        });

        const signer = await ethers.provider.getSigner('0xC105Ea57Eb434Fbe44690d7Dec2702e4a2FBFCf7');

        const systemStatus = await ethers.getContractAt(
          'SystemStatus',
          SYSTEM_STATUS,
          signer
        );

        await systemStatus.connect(signer)['suspendSynthExchange(bytes32,uint256)'](
          ethers.utils.formatBytes32String('sTSLA'),
          ethers.constants.One
        );
      });

      it('returns sUSD and sTSLA outputs', async function () {
        const amount = ethers.BigNumber.from('1000000000');
        await usdc.approve(instance.address, ethers.constants.MaxUint256);

        const [susdBalance, stslaBalance] = await instance.callStatic.exchange(
          amount,
          ethers.constants.Zero,
          ethers.constants.Zero
        );

        expect(susdBalance).to.equal('986020821936502516140');
        expect(stslaBalance).to.equal('1251651965487100324');
      });

      it('decreases USDC balance of sender', async function () {
        const amount = ethers.BigNumber.from('1000000000');
        await usdc.approve(instance.address, ethers.constants.MaxUint256);

        await expect(
          () => instance.exchange(
            amount,
            ethers.constants.Zero,
            ethers.constants.Zero
          )
        ).to.changeTokenBalance(
          usdc,
          signer,
          ethers.constants.Zero.sub(amount)
        );
      });

      it('increases sTSLA balance of sender', async function () {
        const amount = ethers.BigNumber.from('1000000000');
        await usdc.approve(instance.address, ethers.constants.MaxUint256);

        await expect(
          () => instance.exchange(
            amount,
            ethers.constants.Zero,
            ethers.constants.Zero
          )
        ).to.changeTokenBalance(
          stsla,
          signer,
          ethers.BigNumber.from('1250703245637599115')
        );
      });

      it('leaves no tokens locked in contract', async function () {
        const amount = ethers.BigNumber.from('1000000000');
        await usdc.approve(instance.address, ethers.constants.MaxUint256);

        await instance.callStatic.exchange(
          amount,
          ethers.constants.Zero,
          ethers.constants.Zero
        );

        expect(
          await usdc.callStatic.balanceOf(instance.address)
        ).to.equal(
          ethers.constants.Zero
        );

        expect(
          await susd.callStatic.balanceOf(instance.address)
        ).to.equal(
          ethers.constants.Zero
        );

        expect(
          await stsla.callStatic.balanceOf(instance.address)
        ).to.equal(
          ethers.constants.Zero
        );
      });

      describe('reverts if', function () {
        it('contract is not approved to spend USDC', async function () {
          await expect(
            instance.exchange(
              ethers.constants.One,
              ethers.constants.Zero,
              ethers.constants.Zero
            )
          ).to.be.revertedWith(
            'ERC20: transfer amount exceeds allowance'
          );
        });

        it('received sUSD is less than given minimum', async function () {
          await usdc.approve(instance.address, ethers.constants.MaxUint256);

          await expect(
            instance.exchange(
              ethers.utils.parseUnits('1', 6),
              ethers.utils.parseUnits('1', 18),
              ethers.constants.Zero
            )
          ).to.be.reverted;
        });

        it('received sTSLA is less than given minimum', async function () {
          await usdc.approve(instance.address, ethers.constants.MaxUint256);

          await expect(
            instance.exchange(
              ethers.utils.parseUnits('1', 6),
              ethers.constants.Zero,
              ethers.utils.parseUnits('1', 18)
            )
          ).to.be.revertedWith(
            'ERR_LIMIT_OUT'
          );
        });
      });
    });
  });
});

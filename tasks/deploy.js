task('deploy').setAction(async function () {
  const [owner] = await ethers.getSigners();

  const factory = await ethers.getContractFactory('TSLAExchange', owner);
  const instance = await factory.deploy();
  await instance.deployed();

  console.log(instance.address);
});

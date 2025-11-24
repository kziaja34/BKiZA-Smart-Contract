async function main() {
  const Dowcipy = await ethers.getContractFactory("Dowcipy");
  const contract = await Dowcipy.deploy();
  await contract.waitForDeployment();

  console.log("Dowcipy deployed to:", await contract.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

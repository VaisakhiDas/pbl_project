// Compiles contracts using the locally installed `solc` npm package (pure JS/wasm build)
// and writes artifacts in the exact format Hardhat expects, so `hardhat test --no-compile`
// and hardhat-ethers can pick them up normally. This sidesteps Hardhat's own compiler
// downloader, which needs network access to binaries.soliditylang.org.
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const CONTRACTS_DIR = path.join(__dirname, "..", "contracts");
const ARTIFACTS_DIR = path.join(__dirname, "..", "artifacts");
const CACHE_DIR = path.join(__dirname, "..", "cache");

function findImports(importPath) {
  // Resolve node_modules imports (e.g. @openzeppelin/contracts/...)
  const candidates = [
    path.join(__dirname, "..", "node_modules", importPath),
    path.join(CONTRACTS_DIR, importPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { contents: fs.readFileSync(candidate, "utf8") };
    }
  }
  return { error: `File not found: ${importPath}` };
}

function collectSolFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sol"))
    .map((f) => path.join(dir, f));
}

function main() {
  const files = collectSolFiles(CONTRACTS_DIR);
  const sources = {};
  for (const file of files) {
    const relName = "contracts/" + path.basename(file);
    sources[relName] = { content: fs.readFileSync(file, "utf8") };
  }

  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  let hasError = false;
  if (output.errors) {
    for (const err of output.errors) {
      if (err.severity === "error") {
        hasError = true;
        console.error(err.formattedMessage);
      } else {
        console.warn(err.formattedMessage);
      }
    }
  }
  if (hasError) {
    process.exit(1);
  }

  for (const [sourceName, contractsInFile] of Object.entries(output.contracts)) {
    for (const [contractName, contract] of Object.entries(contractsInFile)) {
      const outDir = path.join(ARTIFACTS_DIR, sourceName);
      fs.mkdirSync(outDir, { recursive: true });

      const artifact = {
        _format: "hh-sol-artifact-1",
        contractName,
        sourceName,
        abi: contract.abi,
        bytecode: "0x" + contract.evm.bytecode.object,
        deployedBytecode: "0x" + contract.evm.deployedBytecode.object,
        linkReferences: contract.evm.bytecode.linkReferences || {},
        deployedLinkReferences: contract.evm.deployedBytecode.linkReferences || {},
      };

      fs.writeFileSync(
        path.join(outDir, `${contractName}.json`),
        JSON.stringify(artifact, null, 2)
      );

      // Minimal debug file some tooling expects alongside the artifact
      fs.writeFileSync(
        path.join(outDir, `${contractName}.dbg.json`),
        JSON.stringify(
          { _format: "hh-sol-dbg-1", buildInfo: "../../build-info/local.json" },
          null,
          2
        )
      );

      console.log(`Compiled ${contractName} (${sourceName})`);
    }
  }

  fs.mkdirSync(path.join(ARTIFACTS_DIR, "build-info"), { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CACHE_DIR, "solidity-files-cache.json"), JSON.stringify({}));
}

main();

import { handleChatPost } from './chat-api.js';

const PRAGMA_PATTERN = /pragma\s+solidity\s+([^;]+);/;
const IMPORT_PATTERN = /import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const INTERFACE_DEF_PATTERN = /^\s*interface\s+(\w+)/gm;
const LIBRARY_DEF_PATTERN = /^\s*library\s+(\w+)/gm;
const ABSTRACT_CONTRACT_PATTERN = /^\s*abstract\s+contract\s+(\w+)/gm;
const CONTRACT_DEF_PATTERN = /^\s*contract\s+(\w+)/gm;

const KNOWN_LIBRARIES = {
  '@openzeppelin/': 'OpenZeppelin',
  '@uniswap/': 'Uniswap',
  '@chainlink/': 'Chainlink',
  '@aave/': 'Aave',
  '@layerzerolabs/': 'LayerZero',
  '@axelar-network/': 'Axelar',
  'solmate/': 'Solmate',
  'solady/': 'Solady',
  'ds-test/': 'ds-test',
  'forge-std/': 'forge-std',
  'hardhat/': 'Hardhat',
};

const EXAMPLES = [
  {
    label: 'Aave Pool Proxy',
    chainId: '1',
    address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    note: 'Popular Aave mainnet pool, resolved as an EIP-1967 proxy.',
    tags: ['Aave', 'DeFi', 'Sponsor-style ecosystem'],
  },
  {
    label: 'Uniswap V3 USDT Pool',
    chainId: '1',
    address: '0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36',
    note: 'Verified Uniswap V3 pool with rich storage layout and many source files.',
    tags: ['Uniswap', 'DeFi', 'Popular protocol'],
  },
  {
    label: 'Safe Singleton',
    chainId: '1',
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    note: 'Widely used Safe smart wallet singleton on Ethereum.',
    tags: ['Safe', 'Wallet', 'Smart account'],
  },
  {
    label: 'ERC-4337 EntryPoint v0.6',
    chainId: '1',
    address: '0x0576a174D229E3cFA37253523E645A78A0C91B57',
    note: 'Core account abstraction contract heavily used across wallet infra such as Pimlico and Biconomy ecosystems.',
    tags: ['Account Abstraction', 'Pimlico-adjacent', 'Biconomy-adjacent'],
  },
  {
    label: 'USDC Token',
    chainId: '1',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    note: 'Massively referenced production token contract that makes for a familiar baseline analysis.',
    tags: ['Token', 'Production baseline'],
  },
];

function classifyImport(importPath) {
  for (const [prefix, label] of Object.entries(KNOWN_LIBRARIES)) {
    if (importPath.startsWith(prefix)) return label;
  }
  return 'Unknown / local';
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function readSourceContent(entry) {
  return typeof entry?.content === 'string' ? entry.content : '';
}

function resolveTypeLabel(typeId, types) {
  return types?.[typeId]?.label || typeId || 'unknown';
}

function getStorageLayoutDiagram(data) {
  const layout = data?.storageLayout || {};
  const storage = layout.storage || [];
  const types = layout.types || {};
  if (!storage.length) return '(no storage layout available)';

  const lines = [];
  for (const slot of storage) {
    lines.push(
      `slot ${String(slot.slot ?? '?').padStart(3, ' ')} | off ${String(slot.offset ?? 0).padStart(2, ' ')} | ${slot.label || ''}: ${resolveTypeLabel(slot.type, types)}`,
    );
    if (String(slot.type || '').includes('struct')) {
      const members = types?.[slot.type]?.members || [];
      for (const member of members) {
        lines.push(
          `           +${String(member.slot ?? '?').padStart(2, ' ')} | off ${String(member.offset ?? 0).padStart(2, ' ')} |   ├─ ${member.label || ''}: ${resolveTypeLabel(member.type, types)}`,
        );
      }
    }
  }
  return lines.join('\n');
}

function buildAnalysis(data) {
  const sources = data?.sources || {};
  const sourceEntries = Object.entries(sources);
  const pragmaPerFile = {};
  const importsPerFile = {};
  const libraryUsage = {};
  let interfaceCount = 0;
  let libraryCount = 0;
  let abstractContractCount = 0;
  let contractCount = 0;

  for (const [path, entry] of sourceEntries) {
    const content = readSourceContent(entry);
    const pragmaMatch = content.match(PRAGMA_PATTERN);
    pragmaPerFile[path] = pragmaMatch ? pragmaMatch[1].trim() : null;

    const fileImports = [...content.matchAll(IMPORT_PATTERN)].map((match) => {
      const importPath = match[1];
      const library = classifyImport(importPath);
      libraryUsage[library] = (libraryUsage[library] || 0) + 1;
      return { path: importPath, library };
    });
    importsPerFile[path] = fileImports;

    interfaceCount += countMatches(content, INTERFACE_DEF_PATTERN);
    libraryCount += countMatches(content, LIBRARY_DEF_PATTERN);
    abstractContractCount += countMatches(content, ABSTRACT_CONTRACT_PATTERN);
    contractCount += countMatches(content, CONTRACT_DEF_PATTERN);
  }

  const proxy = data?.proxyResolution || {};
  const compilation = data?.compilation || {};
  const deployment = data?.deployment || {};
  const signatures = data?.signatures || {};

  const summary = {
    chainId: String(data?.chainId || ''),
    address: data?.address || '',
    compilerVersion: compilation.compilerVersion || 'unknown',
    language: compilation.language || 'Solidity',
    sourceFileCount: sourceEntries.length,
    totalDefinitions: {
      interface: interfaceCount,
      library: libraryCount,
      abstractContract: abstractContractCount,
      contract: contractCount,
    },
    proxy: {
      isProxy: Boolean(proxy.isProxy),
      proxyType: proxy.proxyType || null,
      implementations: proxy.implementations || [],
    },
    deployment: {
      transactionHash: deployment.transactionHash || null,
      blockNumber: deployment.blockNumber || null,
      deployer: deployment.deployer || null,
    },
    verification: {
      status: data?.match || 'unknown',
      creation: data?.creationMatch || null,
      runtime: data?.runtimeMatch || null,
      verifiedAt: data?.verifiedAt || null,
    },
    signatureCounts: {
      functions: (signatures.function || []).length,
      events: (signatures.event || []).length,
      errors: (signatures.error || []).length,
    },
    libraryUsage: Object.fromEntries(
      Object.entries(libraryUsage).sort((a, b) => b[1] - a[1]),
    ),
    pragmaPerFile,
    importsPerFile,
    storageLayoutDiagram: getStorageLayoutDiagram(data),
  };

  summary.narrationTranscript = buildNarrationTranscript(summary);
  return summary;
}

function buildNarrationTranscript(summary) {
  const proxySentence = summary.proxy.isProxy
    ? `It is a proxy contract, specifically ${summary.proxy.proxyType || 'an unknown proxy type'}, and the implementation list has ${summary.proxy.implementations.length} ${summary.proxy.implementations.length === 1 ? 'entry' : 'entries'}.`
    : 'It is not a proxy, so the runtime logic sits directly in this verified contract.';

  const topLibraries = Object.entries(summary.libraryUsage)
    .slice(0, 3)
    .map(([label, count]) => `${label} (${count})`)
    .join(', ') || 'no notable external library families';

  return [
    `This contract on chain ${summary.chainId} was verified on Sourcify and compiles with ${summary.compilerVersion}.`,
    `The source bundle contains ${summary.sourceFileCount} files, with ${summary.totalDefinitions.contract} concrete contracts, ${summary.totalDefinitions.abstractContract} abstract contracts, ${summary.totalDefinitions.interface} interfaces, and ${summary.totalDefinitions.library} libraries.`,
    proxySentence,
    `Sourcify exposes ${summary.signatureCounts.functions} function signatures and ${summary.signatureCounts.events} event signatures for this contract.`,
    `The dominant import families in the verified sources are: ${topLibraries}.`,
    `For a spoken walkthrough, I would frame it as compiler and structure first, proxy behavior second, and storage plus interface surface last.`,
  ].join(' ');
}

async function fetchContract(chainId, address) {
  const url = `https://sourcify.dev/server/v2/contract/${encodeURIComponent(chainId)}/${encodeURIComponent(address)}?fields=all`;
  const response = await fetch(url, {
    headers: { 'accept': 'application/json' },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Sourcify request failed (${response.status}): ${body.slice(0, 200)}`);
  }
  return response.json();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/examples') {
      return Response.json({ examples: EXAMPLES });
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChatPost(request, env);
    }

    if (url.pathname === '/api/analyze') {
      try {
        const chainId = url.searchParams.get('chainId') || '1';
        const address = url.searchParams.get('address');
        if (!address) {
          return Response.json({ error: 'address query parameter is required' }, { status: 400 });
        }
        const contractData = await fetchContract(chainId, address);
        const analysis = buildAnalysis(contractData);
        return Response.json({ analysis });
      } catch (error) {
        return Response.json({ error: String(error.message || error) }, { status: 500 });
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(
      'Static UI not built. Run from repo root: cd frontend && npm run build:static-export — then wrangler deploy.',
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
    );
  },
};

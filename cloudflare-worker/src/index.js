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
  },
  {
    label: 'Uniswap V3 USDT Pool',
    chainId: '1',
    address: '0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36',
    note: 'Verified Uniswap V3 pool with rich storage layout and many source files.',
  },
  {
    label: 'Safe Singleton',
    chainId: '1',
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    note: 'Widely used Safe smart wallet singleton on Ethereum.',
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
    ? `It is a proxy contract, specifically ${summary.proxy.proxyType || 'an unknown proxy type'}, and the implementation list has ${summary.proxy.implementations.length} entry${summary.proxy.implementations.length === 1 ? '' : 'ies'}.`
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

function html() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sourcify Worker Demo</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #020617; color: #e2e8f0; }
    main { max-width: 1180px; margin: 0 auto; padding: 32px 18px 80px; }
    h1, h2, h3 { margin: 0 0 12px; }
    p { color: #94a3b8; }
    .grid { display: grid; gap: 18px; }
    .hero, .card { border: 1px solid #1e293b; background: #0f172a; border-radius: 18px; padding: 20px; }
    .examples { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
    .example-btn { width: 100%; text-align: left; background: #111827; color: #e2e8f0; border: 1px solid #334155; border-radius: 14px; padding: 14px; cursor: pointer; }
    .example-btn:hover { border-color: #38bdf8; }
    label { display: block; margin-bottom: 6px; font-size: 14px; color: #94a3b8; }
    input { width: 100%; box-sizing: border-box; padding: 12px; border-radius: 12px; border: 1px solid #334155; background: #020617; color: #f8fafc; }
    .row { display: grid; grid-template-columns: 180px 1fr; gap: 14px; }
    button.primary { margin-top: 14px; padding: 12px 16px; border: none; border-radius: 12px; background: #38bdf8; color: #082f49; font-weight: 800; cursor: pointer; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .metric { padding: 14px; border-radius: 14px; background: #111827; border: 1px solid #1f2937; }
    pre { white-space: pre-wrap; word-break: break-word; overflow-x: auto; background: #020617; border: 1px solid #1e293b; border-radius: 14px; padding: 14px; }
    .two { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; }
    @media (max-width: 900px) { .two, .row { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="grid">
    <section class="hero">
      <h1>Sourcify Contract Analyzer — Cloudflare Worker Edition</h1>
      <p>Single deployment on Cloudflare Workers. The Worker calls Sourcify directly, computes contract structure, proxy information, storage layout summary, and a spoken-style narration transcript.</p>
    </section>

    <section class="card">
      <h2>Example contracts</h2>
      <div class="examples">
        ${EXAMPLES.map((example) => `
          <button class="example-btn" data-chain-id="${example.chainId}" data-address="${example.address}">
            <strong>${example.label}</strong><br />
            <small>${example.address}</small>
            <p>${example.note}</p>
          </button>
        `).join('')}
      </div>
    </section>

    <section class="card">
      <h2>Analyze any verified contract</h2>
      <div class="row">
        <div>
          <label for="chainId">Chain ID</label>
          <input id="chainId" value="1" />
        </div>
        <div>
          <label for="address">Contract address</label>
          <input id="address" value="${EXAMPLES[0].address}" />
        </div>
      </div>
      <button class="primary" id="analyzeButton">Analyze contract</button>
    </section>

    <section class="two">
      <section class="card">
        <h2>Contract snapshot</h2>
        <div class="metrics" id="metrics"></div>
      </section>
      <section class="card">
        <h2>Audio transcript analysis</h2>
        <pre id="transcript">Pick an example or enter an address.</pre>
      </section>
    </section>

    <section class="two">
      <section class="card">
        <h2>Storage layout</h2>
        <pre id="storage">Waiting for analysis…</pre>
      </section>
      <section class="card">
        <h2>Pragmas and imports</h2>
        <pre id="details">Waiting for analysis…</pre>
      </section>
    </section>

    <section class="card">
      <h2>Raw structured JSON</h2>
      <pre id="json">Waiting for analysis…</pre>
    </section>
  </main>

  <script>
    const metrics = document.getElementById('metrics');
    const transcript = document.getElementById('transcript');
    const storage = document.getElementById('storage');
    const details = document.getElementById('details');
    const jsonEl = document.getElementById('json');
    const chainIdInput = document.getElementById('chainId');
    const addressInput = document.getElementById('address');

    function setMetrics(data) {
      const metricRows = [
        ['Compiler', data.compilerVersion],
        ['Files', data.sourceFileCount],
        ['Proxy', data.proxy.isProxy ? data.proxy.proxyType || 'yes' : 'No'],
        ['Functions', data.signatureCounts.functions],
        ['Events', data.signatureCounts.events],
        ['Verified', data.verification.verifiedAt || 'unknown'],
      ];
      metrics.innerHTML = metricRows.map(([label, value]) => '<div class="metric"><strong>' + label + '</strong><br /><span>' + value + '</span></div>').join('');
    }

    function setDetails(data) {
      const topPragmas = Object.entries(data.pragmaPerFile).slice(0, 10);
      const libs = Object.entries(data.libraryUsage).map(([label, count]) => label + ': ' + count).join('\n');
      details.textContent = [
        'Top pragma declarations:',
        ...topPragmas.map(([file, pragma]) => '- ' + file + ': ' + (pragma || 'none')),
        '',
        'Library usage summary:',
        libs || '(none)',
      ].join('\n');
    }

    async function analyze(chainId, address) {
      transcript.textContent = 'Analyzing contract via Worker…';
      storage.textContent = 'Loading storage layout…';
      details.textContent = 'Loading import and pragma details…';
      jsonEl.textContent = 'Loading JSON…';
      metrics.innerHTML = '';

      const response = await fetch('/api/analyze?chainId=' + encodeURIComponent(chainId) + '&address=' + encodeURIComponent(address));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');

      setMetrics(data.analysis);
      transcript.textContent = data.analysis.narrationTranscript;
      storage.textContent = data.analysis.storageLayoutDiagram;
      setDetails(data.analysis);
      jsonEl.textContent = JSON.stringify(data.analysis, null, 2);
    }

    document.getElementById('analyzeButton').addEventListener('click', () => {
      analyze(chainIdInput.value.trim(), addressInput.value.trim()).catch((error) => {
        transcript.textContent = 'Request failed: ' + error.message;
        storage.textContent = '—';
        details.textContent = '—';
        jsonEl.textContent = '—';
      });
    });

    document.querySelectorAll('.example-btn').forEach((button) => {
      button.addEventListener('click', () => {
        chainIdInput.value = button.dataset.chainId;
        addressInput.value = button.dataset.address;
        document.getElementById('analyzeButton').click();
      });
    });
  </script>
</body>
</html>`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/api/examples') {
      return Response.json({ examples: EXAMPLES });
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

    return new Response(html(), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  },
};

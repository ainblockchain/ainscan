/**
 * Seeds the devnet knowledge graph with real explore() transactions
 * that create proper edges (extends, related, prerequisite).
 *
 * Uses a second account so we have 2 explorers visible in the graph.
 */
const Ain = require('/home/comcom/git/ain-js/lib/ain').default;

const PROVIDER = process.env.RPC_URL || 'http://localhost:8081/json-rpc';

// Account 1: existing knowledge creator
const PK1 = 'b22c95ffc4a5c096f7d7d0487ba963ce6ac945bdc91c79b64ce209de289bec96';
const ADDR1 = '0x00ADEc28B6a845a085e03591bE7550dd68673C1C';

// Account 2: a different explorer
const PK2 = '921cc48e48c876fc6ed1eb02a76ad520e8d16a91487f9c7e03441da8e35a0947';
const ADDR2 = '0x01A0980d2D4e418c7F27e1ef539d01A5b5E93204';

// Existing node entry references (from genesis data)
// Entry IDs vary per chain instance - use env-appropriate IDs
const DEVNET_ENTRIES = {
  attention: '-OllAUzTKCy86dOQ7fmd',
  gpt1: '-OllAXRQJ9DS5E5jNSSB',
  gpt2: '-OllAbL3SqX0Auu3asNS',
  gpt3: '-OllAdn2iNQBBJwqphL8',
  llama: '-OllAgEuYtXN5Q35R7io',
  mistral: '-OllAigimYbSyW_l85_4',
  bert: '-OllAl8camxf1XxyBYCH',
  xlnet: '-OllAnaUSMXJ6Mqd-d54',
  roberta: '-OllAq2J2Zu21ywrNL-g',
  t5: '-OllAxOoyromXvXL_oOX',
  vit: '-OllAzqcb8Xk8S6GZmuW',
  clip: '-OllB1IOfbSR_lf--RTt',
  sd: '-OllB3kEAcirm7HPXgJx',
  mamba: '-OllB6C2uHzJvSb9lP-v',
};
const LOCAL_ENTRIES = {
  attention: '-Olk_HhzdD6Fa4PcbeeT',
  gpt1: '-Olk_K9bFwPILUOrdKEf',
  gpt2: '-Olk_P2mA9mPsNIX5Q8i',
  gpt3: '-Olk_RVXu8DvnCTIY8QW',
  llama: '-Olk_Tx4OYvf4SUha7Z8',
  mistral: '-Olk_WOauetNJUmWyG_7',
  bert: '-Olk_Yq5qlUXPgvCQm0L',
  xlnet: '-Olk_aHmuQuhINngQSEs',
  roberta: '-Olk_cjHWaFgcplWlo_g',
  t5: '-Olk_k5aK_MGA3D_xcuJ',
  vit: '-Olk_mY5VZ3qXUu9VnwB',
  clip: '-Olk_oz_6RhaS487oY7b',
  sd: '-Olk_rR5MhSSLBavqM6H',
  mamba: '-Olk_tsmAqeqdrGSzJIT',
};
const E = PROVIDER.includes('localhost') ? LOCAL_ENTRIES : DEVNET_ENTRIES;
const EXISTING = {
  attention: { ownerAddress: ADDR1, topicPath: 'ai/transformers/attention', entryId: E.attention },
  gpt1: { ownerAddress: ADDR1, topicPath: 'ai/transformers/decoder-only', entryId: E.gpt1 },
  gpt2: { ownerAddress: ADDR1, topicPath: 'ai/transformers/decoder-only', entryId: E.gpt2 },
  gpt3: { ownerAddress: ADDR1, topicPath: 'ai/transformers/decoder-only', entryId: E.gpt3 },
  llama: { ownerAddress: ADDR1, topicPath: 'ai/transformers/decoder-only', entryId: E.llama },
  mistral: { ownerAddress: ADDR1, topicPath: 'ai/transformers/decoder-only', entryId: E.mistral },
  bert: { ownerAddress: ADDR1, topicPath: 'ai/transformers/encoder-only', entryId: E.bert },
  xlnet: { ownerAddress: ADDR1, topicPath: 'ai/transformers/encoder-only', entryId: E.xlnet },
  roberta: { ownerAddress: ADDR1, topicPath: 'ai/transformers/encoder-only', entryId: E.roberta },
  t5: { ownerAddress: ADDR1, topicPath: 'ai/transformers/encoder-decoder', entryId: E.t5 },
  vit: { ownerAddress: ADDR1, topicPath: 'ai/transformers/vision', entryId: E.vit },
  clip: { ownerAddress: ADDR1, topicPath: 'ai/transformers/vision', entryId: E.clip },
  sd: { ownerAddress: ADDR1, topicPath: 'ai/transformers/diffusion', entryId: E.sd },
  mamba: { ownerAddress: ADDR1, topicPath: 'ai/state-space-models', entryId: E.mamba },
};

async function main() {
  const ain = new Ain(PROVIDER);

  // ---- Account 1: Set up app rules first ----
  ain.wallet.addAndSetDefaultAccount(PK1);
  console.log(`Account 1: ${ain.wallet.defaultAccount.address}`);
  console.log(`Balance: ${await ain.db.ref('/accounts/' + ADDR1 + '/balance').getValue()}`);

  // Setup knowledge app rules (required before explore() can write)
  console.log('\n--- Setting up knowledge app rules ---');
  const setupResult = await ain.knowledge.setupApp();
  console.log('Setup result:', JSON.stringify(setupResult?.result?.result || setupResult?.result, null, 2)?.slice(0, 300));

  // Explore 1: "Multi-Head Attention Deep Dive" extends the Attention paper
  console.log('\n--- Explore 1: Multi-Head Attention (extends Attention) ---');
  const r1 = await ain.knowledge.explore({
    topicPath: 'ai/transformers/attention',
    title: 'Multi-Head Attention Deep Dive',
    content: 'Multi-head attention allows the model to jointly attend to information from different representation subspaces. Instead of performing a single attention function, queries, keys and values are linearly projected h times with different learned projections.',
    summary: 'Deep dive into multi-head attention mechanism and its role in transformer architectures',
    depth: 4,
    tags: 'attention,multi-head,transformers',
    parentEntry: EXISTING.attention,
  });
  console.log('Result:', JSON.stringify(r1.txResult?.result || r1.txResult, null, 2)?.slice(0, 200));
  const explore1 = { ownerAddress: ADDR1, topicPath: 'ai/transformers/attention', entryId: r1.entryId };

  // Explore 2: "GPT-4 and Scaling Laws" extends GPT-3, related to LLaMA
  console.log('\n--- Explore 2: GPT-4 and Scaling (extends GPT-3, related to LLaMA) ---');
  const r2 = await ain.knowledge.explore({
    topicPath: 'ai/transformers/decoder-only',
    title: 'GPT-4 and Scaling Laws',
    content: 'GPT-4 is a large multimodal model that accepts image and text inputs and produces text outputs. It demonstrates human-level performance on various benchmarks. Scaling laws show predictable improvement with compute, data, and parameters.',
    summary: 'Analysis of GPT-4 capabilities and the role of scaling laws in LLM development',
    depth: 3,
    tags: 'gpt4,scaling,multimodal',
    parentEntry: EXISTING.gpt3,
    relatedEntries: [
      { ...EXISTING.llama, type: 'related' },
    ],
  });
  console.log('Result:', JSON.stringify(r2.txResult?.result || r2.txResult, null, 2)?.slice(0, 200));
  const explore2 = { ownerAddress: ADDR1, topicPath: 'ai/transformers/decoder-only', entryId: r2.entryId };

  // Explore 3: "BERT vs GPT: Bidirectional vs Autoregressive" related to both
  console.log('\n--- Explore 3: BERT vs GPT comparison (related to BERT and GPT-1) ---');
  const r3 = await ain.knowledge.explore({
    topicPath: 'ai/transformers/attention',
    title: 'Bidirectional vs Autoregressive: BERT vs GPT Paradigms',
    content: 'The two main pretraining paradigms for transformers are bidirectional (BERT-style masked LM) and autoregressive (GPT-style causal LM). BERT sees all tokens bidirectionally but requires task-specific heads. GPT generates tokens autoregressively and can be used zero-shot.',
    summary: 'Comparing bidirectional (BERT) and autoregressive (GPT) transformer pretraining approaches',
    depth: 3,
    tags: 'bert,gpt,comparison,pretraining',
    parentEntry: explore1,
    relatedEntries: [
      { ...EXISTING.bert, type: 'related' },
      { ...EXISTING.gpt1, type: 'related' },
    ],
  });
  console.log('Result:', JSON.stringify(r3.txResult?.result || r3.txResult, null, 2)?.slice(0, 200));

  // Explore 4: "Vision Transformers and CLIP connection" extends ViT, prerequisite CLIP
  console.log('\n--- Explore 4: ViT-CLIP bridge (extends ViT, prerequisite to CLIP) ---');
  const r4 = await ain.knowledge.explore({
    topicPath: 'ai/transformers/vision',
    title: 'From ViT to CLIP: Bridging Vision and Language',
    content: 'Vision Transformer (ViT) showed that a pure transformer applied to sequences of image patches can perform well on image classification. CLIP then combined ViT with a text encoder to learn visual concepts from natural language supervision, enabling zero-shot transfer.',
    summary: 'How ViT enabled the development of CLIP and multimodal vision-language models',
    depth: 3,
    tags: 'vit,clip,multimodal,vision',
    parentEntry: EXISTING.vit,
    relatedEntries: [
      { ...EXISTING.clip, type: 'prerequisite' },
    ],
  });
  console.log('Result:', JSON.stringify(r4.txResult?.result || r4.txResult, null, 2)?.slice(0, 200));

  // ---- Account 2: A different explorer ----
  ain.wallet.addAndSetDefaultAccount(PK2);
  console.log(`\nAccount 2: ${ain.wallet.defaultAccount.address}`);
  console.log(`Balance: ${await ain.db.ref('/accounts/' + ADDR2 + '/balance').getValue()}`);

  // Explore 5: Second user explores "Attention" with a different perspective
  console.log('\n--- Explore 5 (User 2): Attention from NLP perspective ---');
  const r5 = await ain.knowledge.explore({
    topicPath: 'ai/transformers/attention',
    title: 'Attention Mechanisms in NLP: A Practitioner\'s Guide',
    content: 'Attention mechanisms allow neural networks to focus on relevant parts of the input. In NLP, self-attention enables each token to attend to every other token, capturing long-range dependencies. This replaced recurrence and convolution as the primary sequence modeling mechanism.',
    summary: 'Practical guide to understanding and implementing attention mechanisms for NLP tasks',
    depth: 2,
    tags: 'attention,nlp,practical',
    parentEntry: EXISTING.attention,
  });
  console.log('Result:', JSON.stringify(r5.txResult?.result || r5.txResult, null, 2)?.slice(0, 200));

  // Explore 6: Second user explores decoder-only, extends GPT-2
  console.log('\n--- Explore 6 (User 2): Fine-tuning GPT-2 (extends GPT-2) ---');
  const r6 = await ain.knowledge.explore({
    topicPath: 'ai/transformers/decoder-only',
    title: 'Fine-tuning GPT-2 for Domain-Specific Generation',
    content: 'GPT-2 can be fine-tuned on domain-specific corpora to generate targeted text. Key techniques include learning rate scheduling, gradient accumulation, and careful data curation. Fine-tuned GPT-2 models have been used for code generation, creative writing, and scientific text.',
    summary: 'Techniques and best practices for fine-tuning GPT-2 on specialized domains',
    depth: 3,
    tags: 'gpt2,fine-tuning,generation',
    parentEntry: EXISTING.gpt2,
    relatedEntries: [
      { ...EXISTING.mistral, type: 'related' },
    ],
  });
  console.log('Result:', JSON.stringify(r6.txResult?.result || r6.txResult, null, 2)?.slice(0, 200));

  // Explore 7: Second user links encoder-only research
  console.log('\n--- Explore 7 (User 2): BERT for Information Retrieval (extends BERT, related to RoBERTa) ---');
  const r7 = await ain.knowledge.explore({
    topicPath: 'ai/transformers/encoder-only',
    title: 'BERT for Dense Passage Retrieval',
    content: 'BERT-based models revolutionized information retrieval by enabling dense passage representations. DPR (Dense Passage Retrieval) uses BERT to encode queries and passages into dense vectors, replacing sparse TF-IDF methods with semantic similarity search.',
    summary: 'How BERT transformed information retrieval with dense passage encoding',
    depth: 4,
    tags: 'bert,retrieval,dpr,search',
    parentEntry: EXISTING.bert,
    relatedEntries: [
      { ...EXISTING.roberta, type: 'related' },
      { ...EXISTING.xlnet, type: 'related' },
    ],
  });
  console.log('Result:', JSON.stringify(r7.txResult?.result || r7.txResult, null, 2)?.slice(0, 200));

  // Summary
  console.log('\n=== Done! Created 7 explorations with edges ===');
  console.log('Edges created:');
  console.log('  - Multi-Head Attention -> extends -> Attention Is All You Need');
  console.log('  - GPT-4 Scaling -> extends -> GPT-3, related -> LLaMA');
  console.log('  - BERT vs GPT -> extends -> Multi-Head Attention, related -> BERT, related -> GPT-1');
  console.log('  - ViT-CLIP Bridge -> extends -> ViT, prerequisite -> CLIP');
  console.log('  - User2 Attention -> extends -> Attention Is All You Need');
  console.log('  - User2 GPT-2 Fine-tuning -> extends -> GPT-2, related -> Mistral');
  console.log('  - User2 BERT Retrieval -> extends -> BERT, related -> RoBERTa, related -> XLNet');
}

main().catch(err => {
  console.error('Error:', err.message || err);
  process.exit(1);
});

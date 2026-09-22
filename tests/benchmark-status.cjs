const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validBenchmark,benchmarkIsStale}=require(process.env.BENCHMARK_STATUS_MODULE);
const genesis='0x'+'a'.repeat(64);
const value={version:1,kind:'l2_peer',runId:'run_1',genesisHash:genesis,phase:'running',updatedAt:new Date().toISOString(),completedAt:null,averageTPS:8000,peakTPS:8100,currentTPS:8000,measured:80000,elapsedMs:10000,failures:0,samples:[8000],finalized:false,checkpointTx:null};
test('separates network identity and metric kinds',()=>{
 assert.ok(validBenchmark(value,'l2_peer',genesis));
 assert.ok(!validBenchmark(value,'l1',genesis));
 assert.ok(!validBenchmark(value,'l2_peer','other'));
});
test('rejects inflated rates and invalid samples',()=>{
 assert.ok(!validBenchmark({...value,averageTPS:9000},'l2_peer',genesis));
 assert.ok(!validBenchmark({...value,samples:[Infinity]},'l2_peer',genesis));
 assert.ok(!validBenchmark({...value,measured:-1},'l2_peer',genesis));
});
test('requires finalized evidence for completed runs',()=>{
 assert.ok(!validBenchmark({...value,phase:'completed'},'l2_peer',genesis));
 const final={...value,phase:'completed',finalized:true,completedAt:new Date().toISOString(),checkpointTx:'0x'+'b'.repeat(64)};
 assert.ok(validBenchmark(final,'l2_peer',genesis));
 assert.ok(!benchmarkIsStale(final,Date.now()+100000));
});
test('interrupted live runs do not remain live',()=>{
 assert.ok(!benchmarkIsStale(value,Date.parse(value.updatedAt)+1000));
 assert.ok(benchmarkIsStale(value,Date.parse(value.updatedAt)+31000));
});

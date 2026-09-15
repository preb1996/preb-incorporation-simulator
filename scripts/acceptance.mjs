import {readFileSync} from 'node:fs';
const status=JSON.parse(readFileSync(new URL('../docs/acceptance.json',import.meta.url),'utf8'));
const blocked=status.requirements.filter(x=>x.status==='BLOCKED'||x.status==='FAIL');
if(blocked.length){console.error('SPEC_BLOCKER: v1.0の完了条件は未達。部品テストPASSを完成と扱わない。');for(const item of blocked)console.error(`${item.id}: ${item.reason}`);process.exitCode=1;}
else console.log(`ACCEPTED: ${status.implementationStatus} (${status.requirements.filter(x=>x.status==='PASS').length} PASS, ${status.requirements.filter(x=>x.status==='OUT_OF_PHASE').length} OUT_OF_PHASE)`);

#!/usr/bin/env python3
"""Import/check the explicitly pinned, dependency-complete tracking contract subset.
Never reads the dirty headless working tree. No provider/network calls.
"""
from pathlib import Path
import argparse, hashlib, io, json, posixpath, re, subprocess, tarfile
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT.parent/'utekos-headless'
COMMIT='e74e6cd8310c88f2777cbfdf5ad6b431647d7f77'
ROOTS=[f'src/lib/analytics/{name}.ts' for name in (
'canonicalEvent','eventCatalog','browserReporterContext','pageViewSession','sendCanonicalGTMEvent',
'enrichCanonicalEventWithMetaAttribution','googleAnalyticsBrowserIds','internalJourneyContext',
'checkoutAttributionSnapshot','checkoutProductContext','shopifyViewItemCommerce','emitMicrosoftUetIdSync',
'webVitalEvent','metaParameterContextContract','metaClientIpContract')]
ROOTS+=['public/analytics/meta-pixel-canonical-v1.js', 'src/types/meta-capi-param-builder-clientjs.d.ts', 'src/lib/analytics/leadFormTrackingContext.ts', 'src/lib/observability/journey/contract.ts']
# Reviewed v2/backend extensions retain the original upstream hash as provenance.
OVERRIDES=ROOT/'docs/tracking/contract-overrides.json'
overrides=json.loads(OVERRIDES.read_text())['files'] if OVERRIDES.exists() else {}
def expected_hash(path, base_hash):
    override=overrides.get(path)
    if not override:return base_hash
    if override['baseSha256']!=base_hash or not override.get('reason'):
        raise SystemExit('Invalid reviewed override: '+path)
    return override['sha256']
def local_hash(path):
    return hashlib.sha256((ROOT/path).read_bytes()).hexdigest() if (ROOT/path).is_file() else None
parser=argparse.ArgumentParser(); parser.add_argument('--write',action='store_true'); parser.add_argument('--manifest',action='store_true',help='Verify checked-in hashes without the source checkout (CI).'); args=parser.parse_args()
if args.manifest:
    if args.write: raise SystemExit('--manifest cannot write contracts')
    manifest=json.loads((ROOT/'docs/tracking/contract-manifest.json').read_text())
    if manifest['sourceCommit']!=COMMIT:raise SystemExit('Unexpected source commit')
    if set(overrides)-set(manifest['files']):raise SystemExit('Unknown override path')
    drift=[p for p,h in manifest['files'].items() if local_hash(p)!=expected_hash(p,h)]
    if drift:raise SystemExit('Contract parity mismatch: '+str(drift))
    print(json.dumps({'commit':COMMIT,'files':len(manifest['files']),'verified':'manifest','reviewedOverrides':sorted(overrides)},indent=2))
    raise SystemExit(0)
data=subprocess.check_output(['git','archive',COMMIT,'src','types','public/analytics','supabase/functions/_shared'],cwd=SOURCE)
with tarfile.open(fileobj=io.BytesIO(data)) as tar:
    files={f.name:tar.extractfile(f).read() for f in tar.getmembers() if f.isfile()}
seen={}; missing=[]; external=set()
def visit(path):
    if path in seen:return
    if path not in files:missing.append(path);return
    seen[path]=files[path]
    if not path.endswith(('.ts','.tsx','.js')):return
    for spec in re.findall(r'(?:from\s+|import\s*\(\s*|import\s+)[\'\"]([^\'\"]+)',files[path].decode()):
        if spec.startswith('@/'): base='src/'+spec[2:]
        elif spec.startswith('types/'):base=spec
        elif spec.startswith('.'):base=posixpath.normpath(posixpath.join(posixpath.dirname(path),spec))
        else:external.add(spec);continue
        target=next((p for p in [base,base+'.ts',base+'.tsx',base+'/index.ts'] if p in files),None)
        if target:visit(target)
        else:missing.append(base)
for root in ROOTS:visit(root)
if missing:raise SystemExit('Missing imports: '+str(missing))
manifest={'sourceRepository':'Team-Kelc-AS/utekos-headless','sourceCommit':COMMIT,'roots':ROOTS,
'files':{p:hashlib.sha256(b).hexdigest() for p,b in sorted(seen.items())},'externalImports':sorted(external)}
if args.write:
    for p,b in seen.items():
        target=ROOT/p
        if target.exists() and local_hash(p)!=expected_hash(p,hashlib.sha256(b).hexdigest()):raise SystemExit('Refusing to overwrite divergent file: '+p)
    for p,b in seen.items():
        if p in overrides:continue
        target=ROOT/p;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
    target=ROOT/'docs/tracking/contract-manifest.json';target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(manifest,indent=2)+'\n')
else:
    if set(overrides)-set(seen):raise SystemExit('Unknown override path')
    drift=[p for p,b in seen.items() if local_hash(p)!=expected_hash(p,hashlib.sha256(b).hexdigest())]
    if drift:raise SystemExit('Contract parity mismatch: '+str(drift))
print(json.dumps({'commit':COMMIT,'files':len(seen),'externalImports':sorted(external),'written':args.write},indent=2))

#!/usr/bin/env python3
"""Manual campaign runner. Defaults to dry-run; never schedules background sends."""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import sys
import time
import urllib.request

PLACEHOLDER = '{{{RESEND_UNSUBSCRIBE_URL}}}'


def payload_for(campaign, contact):
    url = contact['unsubscribeUrl']
    if not url.startswith('https://utekos.no/api/email/marketing/unsubscribe?token=m1.'):
        raise ValueError('Invalid unsubscribe URL')
    if f'href="{PLACEHOLDER}"' not in campaign['html'] or PLACEHOLDER not in campaign['text']:
        raise ValueError('Unsubscribe placeholder missing')
    payload = {**campaign, 'to': [contact['email']],
               'html': campaign['html'].replace(PLACEHOLDER, url.replace('&', '&amp;')),
               'text': campaign['text'].replace(PLACEHOLDER, url),
               'headers': {'List-Unsubscribe': '<'+url+'>',
                           'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'}}
    if '{{{' in payload['html'] + payload['text']:
        raise ValueError('Unresolved template variable')
    return payload


def eligible(contact, fresh):
    if fresh.get('id') != contact['id'] or fresh.get('email', '').lower() != contact['email'].lower():
        raise ValueError('Recipient changed')
    if not isinstance(fresh.get('unsubscribed'), bool):
        raise ValueError('Subscription state missing')
    return not fresh['unsubscribed']


def call_api(key, path, body=None, idempotency=None):
    headers = {'Authorization': 'Bearer '+key, 'User-Agent': 'Utekos-Marketing/1'}
    if body is not None:
        headers['Content-Type'] = 'application/json'
    if idempotency:
        headers['Idempotency-Key'] = idempotency
    request = urllib.request.Request('https://api.resend.com'+path,
        data=json.dumps(body).encode() if body is not None else None, headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def append_receipt(path, entry):
    with path.open('a') as ledger:
        ledger.write(json.dumps(entry)+'\n')
        ledger.flush()
        os.fsync(ledger.fileno())
    path.chmod(0o600)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, default=Path('.env-campaign-state'))
    parser.add_argument('--group', choices=['a', 'b'], required=True)
    parser.add_argument('--send', action='store_true')
    parser.add_argument('--env-file', type=Path)
    args = parser.parse_args()
    root = args.state
    release = json.loads((root/'release.json').read_text())
    for name in ['campaign.json', 'group-a.json', 'group-b.json']:
        if hashlib.sha256((root/name).read_bytes()).hexdigest() != release.get('manifestHashes', {}).get(name):
            raise ValueError('Reviewed campaign manifest changed')
    campaign = json.loads((root/'campaign.json').read_text())
    recipients = json.loads((root/f'group-{args.group}.json').read_text())
    other = json.loads((root/f'group-{"b" if args.group == "a" else "a"}.json').read_text())
    combined = recipients + other
    if len({x['id'] for x in combined}) != len(combined) or len({x['email'].lower() for x in combined}) != len(combined):
        raise ValueError('Duplicate recipient across groups')
    for contact in combined:
        if contact['email'].rsplit('@', 1)[-1].lower() in ['kelc.no', 'utekos.no']:
            raise ValueError('Excluded internal domain')
        payload_for(campaign, contact)
    if not args.send:
        print(json.dumps({'mode': 'dry-run', 'group': args.group, 'recipients': len(recipients), 'sent': 0}))
        return
    authorization = release.get('authorizedGroups', {}).get(args.group, {})
    now = time.time()
    if release.get('status') != 'RELEASED' or not authorization.get('notBefore', float('inf')) <= now < authorization.get('expiresAt', 0):
        raise ValueError('Campaign is on hold or authorization window is closed')
    keys = dict(os.environ)
    if args.env_file:
        for line in args.env_file.read_text().splitlines():
            name, sep, value = line.partition('=')
            if sep and name.strip() in ['RESEND_API_KEY', 'RESEND_HEADLESS_API_KEY_RESEND_API_KEY']:
                keys[name.strip()] = value.strip().strip('\"').strip("'")
    key = keys.get('RESEND_HEADLESS_API_KEY_RESEND_API_KEY') or keys.get('RESEND_API_KEY')
    if not key:
        raise ValueError('Sending key missing')
    # A single shared lock prevents overlapping A/B processes. Accepted receipts
    # are durable beyond the provider's 24-hour idempotency retention window.
    with (root/'delivery.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        ledger_path = root/'receipts.jsonl'
        entries = [json.loads(line) for line in ledger_path.read_text().splitlines()] if ledger_path.exists() else []
        latest = {x['contactId']: x for x in entries}
        accepted = skipped = 0
        for contact in recipients:
            # Re-read HOLD between recipients so a stop instruction is effective.
            if json.loads((root/'release.json').read_text()).get('status') != 'RELEASED':
                raise ValueError('Campaign paused')
            payload = payload_for(campaign, contact)
            digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
            previous = latest.get(contact['id'])
            if previous and previous['status'] in ['accepted', 'unsubscribed']:
                skipped += 1
                continue
            if previous and (previous['payloadHash'] != digest or time.time()-previous['time'] > 23*3600):
                raise ValueError('Pending send needs reconciliation before retry')
            fresh = call_api(key, '/contacts/'+contact['id'])
            entry = {'contactId': contact['id'], 'group': args.group, 'payloadHash': digest,
                     'time': previous['time'] if previous else time.time()}
            if not eligible(contact, fresh):
                append_receipt(ledger_path, {**entry, 'status': 'unsubscribed'})
                skipped += 1
                continue
            append_receipt(ledger_path, {**entry, 'status': 'pending'})
            receipt = call_api(key, '/emails', payload,
                'comfyrobe-20261027/'+contact['id'])
            if not receipt.get('id'):
                raise ValueError('Provider receipt missing; reconcile before retry')
            append_receipt(ledger_path, {**entry, 'status': 'accepted', 'emailId': receipt['id']})
            accepted += 1
            print(json.dumps({'acceptedThisRun': accepted, 'skipped': skipped}), flush=True)
            time.sleep(0.35)
        print(json.dumps({'completed': True, 'acceptedThisRun': accepted, 'skipped': skipped}))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Provider response bodies can contain personal information: never log them.
        print('Stopped safely: '+type(error).__name__, file=sys.stderr)
        sys.exit(1)

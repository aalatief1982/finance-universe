# SMS Listener Phase 2 — Durable Inbox Queue

## Overview
Phase 2 adds a durable SMS inbox queue in local storage so incoming SMS events are persisted for review, even when multiple messages arrive close together.

## Storage key + schema
- **Storage key**: `xpensia_sms_inbox_queue`
- **Item schema**:

```ts
{
  id: string,
  sender: string,
  body: string,
  receivedAt: string, // ISO
  status: 'new' | 'processed' | 'ignored',
  source: 'listener'
}
```

Queue utility location:
- `src/lib/sms-inbox/smsInboxQueue.ts`

## Dedup rules
On `enqueueSms`:
1. Build `dedupKey = normalize(sender) + '|' + normalize(body)`.
2. `normalize` trims, lowercases, and collapses repeated whitespace.
3. If an existing queue item has the same `dedupKey` and its `receivedAt` is within the last 10 minutes of the incoming message timestamp, the incoming SMS is ignored (no insert).

## Max size rule
- Queue retains at most **200** items.
- If insertion would exceed 200, oldest items are dropped and newest items are kept.

## Call sites changed (file/function)
- `src/App.tsx`
  - `BackgroundSmsListener.addListener('smsReceived', ...)` now calls:
    - `enqueueSms({ sender, body, source: 'listener' })`
- This happens before foreground toast/background notification handling so both states persist into queue first.

## Routing and notification behavior
- Notification tap routing remains unchanged: app navigates to `/import-transactions`.
- Local notification scheduling remains unchanged.
- No SMS parsing is performed in listener.

## Rollback notes
To rollback Phase 2 only:
1. Remove `enqueueSms` import and call in `src/App.tsx` listener callback.
2. Optionally remove `src/lib/sms-inbox/smsInboxQueue.ts` if no longer used.
3. Existing app behavior (toast + local notification + `/import-transactions` routing on notification tap) continues as before.

## Manual verification steps (no build/test required)
Run these steps in browser devtools console while app is running:

1. **Reset queue**
   ```js
   localStorage.removeItem('xpensia_sms_inbox_queue')
   ```

2. **Enqueue one SMS and verify count increments**
   ```js
   // import from app bundle context if available in your debug harness
   // enqueueSms({ sender: 'HDFC', body: 'Rs 120 spent at Cafe', source: 'listener' })
   // getInboxCount() // expected: 1
   ```

3. **Verify duplicate suppression within 10 minutes**
   ```js
   // enqueueSms({ sender: '  hdfc ', body: 'RS 120   spent at cafe', receivedAt: new Date().toISOString(), source: 'listener' })
   // getInboxCount() // expected: still 1 (same normalized sender/body within 10 minutes)
   ```

4. **Verify enqueue outside dedup window inserts**
   ```js
   // enqueueSms({ sender: 'HDFC', body: 'Rs 120 spent at Cafe', receivedAt: new Date(Date.now() + 11*60*1000).toISOString(), source: 'listener' })
   // getInboxCount() // expected: 2
   ```

5. **Verify max limit truncation to 200**
   ```js
   // clearInbox()
   // for (let i = 0; i < 205; i++) {
   //   enqueueSms({ sender: `BANK-${i}`, body: `Txn ${i}`, receivedAt: new Date(Date.now() + i * 1000).toISOString(), source: 'listener' })
   // }
   // getInboxCount() // expected: 200
   // getInbox()[0] should correspond to a later item (oldest entries were dropped)
   ```

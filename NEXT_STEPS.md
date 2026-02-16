# Next Steps - Remaining Features

**Last Updated:** February 16, 2026

---

## ✅ COMPLETED TODAY

### 1. Second-Level Disposition Management ✅
- Full CRUD API endpoints (`/api/admin/dispositions/second-level/[id]`)
- Admin UI tab for managing Sale/No Sale statuses
- Integration with existing disposition system

### 2. Disposition Validation Rules ✅
- "Sale" or "No Sale" requires "Contacted" first level
- Third level requires second level
- Category matching validation (No Sale → no_sale reasons)
- Prevents illogical disposition combinations

### 3. Disposition History Tracking ✅
- Database model created and migrated
- Automatic history creation on every disposition save
- Atomic transactions ensure data consistency
- API endpoint to fetch history: `/api/admin/leads/[id]/disposition/history`

### 4. Leads Table Improvements ✅
- **Contact Status** column with color-coded tags
- **Sale Status** column (green for Sale, red for No Sale)
- **Last Called** column showing timestamp or "Never"
- Sortable and filterable

---

## 🚧 REMAINING FEATURES (Priority Order)

### HIGH PRIORITY (Next Session)

#### 1. CallLeadModal Enhancements
**Time Estimate:** 2 hours

**Features to Add:**
```typescript
// A. Call Timer (30 min)
const [callDuration, setCallDuration] = useState(0)
const [isCallActive, setIsCallActive] = useState(false)

useEffect(() => {
  let interval: NodeJS.Timeout
  if (isCallActive) {
    interval = setInterval(() => setCallDuration(prev => prev + 1), 1000)
  }
  return () => clearInterval(interval)
}, [isCallActive])

// Display in modal header or near phone number
<Button onClick={() => setIsCallActive(!isCallActive)}>
  {isCallActive ? `End Call (${formatDuration(callDuration)})` : 'Start Call'}
</Button>

// B. Quick Notes Templates (30 min)
const noteTemplates = [
  "Customer interested, will call back",
  "Not interested at this time",
  "Wrong number",
  "Requested more information",
  "Ready to purchase",
  "Voicemail left",
  "Busy, call later"
]

<Select 
  placeholder="Quick Notes Templates"
  onChange={(value) => form.setFieldValue('dispositionNotes', value)}
>
  {noteTemplates.map(t => <Option value={t}>{t}</Option>)}
</Select>

// C. Call History Tab (1 hour)
<Tabs>
  <TabPane tab="Record Disposition" key="1">
    {/* Existing disposition form */}
  </TabPane>
  <TabPane tab={<span><HistoryOutlined /> Call History</span>} key="2">
    <Timeline>
      {dispositionHistory.map(h => (
        <Timeline.Item key={h.id}>
          <Text strong>{new Date(h.changedAt).toLocaleString()}</Text>
          <Space>
            {h.firstLevelDisposition && <Tag>{h.firstLevelDisposition.name}</Tag>}
            {h.secondLevelDisposition && <Tag>{h.secondLevelDisposition.name}</Tag>}
          </Space>
          <Text type="secondary">by {h.changedBy.name}</Text>
        </Timeline.Item>
      ))}
    </Timeline>
  </TabPane>
</Tabs>
```

**Files to Edit:**
- `components/admin/CallLeadModal.tsx`

---

#### 2. Bulk Disposition Actions
**Time Estimate:** 2 hours

**Implementation:**
```typescript
// File: app/admin/leads/page.tsx

// Add bulk actions dropdown
const [selectedAction, setSelectedAction] = useState<string>()

<Select 
  placeholder="Bulk Actions" 
  style={{ width: 200, marginBottom: 16 }}
  onChange={setSelectedAction}
  disabled={selectedLeads.length === 0}
>
  <Option value="mark_not_contacted">Mark as Not Contacted</Option>
  <Option value="mark_no_answer">Mark as No Answer</Option>
  <Option value="mark_contacted">Mark as Contacted</Option>
</Select>
<Button 
  type="primary" 
  onClick={handleBulkAction}
  disabled={!selectedAction || selectedLeads.length === 0}
>
  Apply to {selectedLeads.length} leads
</Button>

// Handler
const handleBulkAction = async () => {
  const dispositionMap = {
    mark_not_contacted: { firstLevelDispositionId: notContactedId },
    mark_no_answer: { firstLevelDispositionId: notContactedId, thirdLevelDispositionId: noAnswerId },
    mark_contacted: { firstLevelDispositionId: contactedId }
  }
  
  await api.post('/admin/leads/bulk-disposition', {
    leadIds: selectedLeads,
    dispositionData: dispositionMap[selectedAction]
  })
  
  message.success(`Updated ${selectedLeads.length} leads`)
  setSelectedLeads([])
  fetchData()
}
```

**New API Endpoint:**
```typescript
// File: app/api/admin/leads/bulk-disposition/route.ts

export async function POST(req: NextRequest) {
  return withAuthAndRole(['ADMIN', 'SUPERVISOR'], async (authReq) => {
    const { leadIds, dispositionData } = await req.json()
    
    // Update all leads
    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: {
        ...dispositionData,
        lastCalledAt: new Date()
      }
    })
    
    // Create history entries for each
    await prisma.dispositionHistory.createMany({
      data: leadIds.map(leadId => ({
        leadId,
        ...dispositionData,
        changedById: authReq.user.id
      }))
    })
    
    return NextResponse.json({ 
      message: `Updated ${leadIds.length} leads` 
    })
  })(req)
}
```

---

### MEDIUM PRIORITY (This Week)

#### 3. Admin Dashboard with KPIs
**Time Estimate:** 4 hours

**Features:**
- Overall Answer Rate widget
- Overall Conversion Rate widget
- Top Performing Agents table
- Calls Over Time chart (recharts)
- Conversions Over Time chart
- Campaign Comparison table

**Files to Create:**
- `app/admin/dashboard/page.tsx`
- `app/api/admin/dashboard/metrics/route.ts`
- `components/admin/dashboard/KPICard.tsx`
- `components/admin/dashboard/TrendChart.tsx`

**Sample Implementation:**
```typescript
// File: app/api/admin/dashboard/metrics/route.ts

export async function GET(req: NextRequest) {
  return withAuthAndRole(['ADMIN', 'SUPERVISOR'], async () => {
    const [totalLeads, calledLeads, contactedLeads, salesLeads] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { lastCalledAt: { not: null } } }),
      prisma.lead.count({ where: { firstLevelDisposition: { name: 'Contacted' } } }),
      prisma.lead.count({ where: { secondLevelDisposition: { name: 'Sale' } } })
    ])
    
    const callingRate = totalLeads > 0 ? (calledLeads / totalLeads) * 100 : 0
    const answerRate = calledLeads > 0 ? (contactedLeads / calledLeads) * 100 : 0
    const conversionRate = contactedLeads > 0 ? (salesLeads / contactedLeads) * 100 : 0
    
    return NextResponse.json({
      totalLeads,
      calledLeads,
      contactedLeads,
      salesLeads,
      callingRate,
      answerRate,
      conversionRate
    })
  })(req)
}
```

---

#### 4. Export Functionality for All Reports
**Time Estimate:** 1 hour

**Implementation:**
```bash
npm install papaparse
npm install --save-dev @types/papaparse
```

```typescript
// Add to all report pages

import Papa from 'papaparse'
import { DownloadOutlined } from '@ant-design/icons'

const handleExportCSV = () => {
  const csv = Papa.unparse(reportData)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${reportType}-${new Date().toISOString()}.csv`
  link.click()
}

<Button 
  icon={<DownloadOutlined />} 
  onClick={handleExportCSV}
  disabled={!reportData || reportData.length === 0}
>
  Export to CSV
</Button>
```

**Files to Update:**
- `app/admin/reports/page.tsx`
- `app/admin/campaigns/page.tsx`
- `app/admin/leads/page.tsx`

---

### LOW PRIORITY (Future)

#### 5. Performance Optimizations (Redis Caching)
**Time Estimate:** 2 hours

**Setup:**
```bash
npm install redis
```

```typescript
// File: lib/cache/redis.ts

import { createClient } from 'redis'

const redis = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
})

redis.on('error', (err) => console.error('Redis error:', err))
redis.connect()

export async function getCachedOrFetch<T>(
  key: string, 
  fetchFn: () => Promise<T>, 
  ttl = 300
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)
  
  const data = await fetchFn()
  await redis.setEx(key, ttl, JSON.stringify(data))
  return data
}

export { redis }
```

**Usage in Campaign Metrics:**
```typescript
const metrics = await getCachedOrFetch(
  `campaign:${campaignId}:metrics`,
  () => calculateCampaignMetrics(campaignId),
  300 // 5 minutes
)
```

---

#### 6. Scheduled Email Reports
**Time Estimate:** 3 hours

**Setup:**
```bash
npm install nodemailer node-cron
```

**Implementation:**
```typescript
// File: lib/jobs/email-reports.ts

import cron from 'node-cron'
import nodemailer from 'nodemailer'

// Run daily at 8 AM
cron.schedule('0 8 * * *', async () => {
  const report = await generateDailyReport()
  await sendEmail({
    to: 'admin@example.com',
    subject: 'Daily Performance Report',
    html: formatReportHTML(report)
  })
})
```

---

## 📊 PROGRESS SUMMARY

| Feature | Status | Priority | Time |
|---------|--------|----------|------|
| Second-level disposition CRUD | ✅ Complete | Critical | - |
| Disposition validation rules | ✅ Complete | Critical | - |
| Disposition history tracking | ✅ Complete | Critical | - |
| Leads table improvements | ✅ Complete | High | - |
| CallLeadModal enhancements | 🚧 Pending | High | 2h |
| Bulk disposition actions | 🚧 Pending | High | 2h |
| Admin dashboard | 🚧 Pending | Medium | 4h |
| Export functionality | 🚧 Pending | Medium | 1h |
| Performance optimizations | 🚧 Pending | Low | 2h |
| Scheduled reports | 🚧 Pending | Low | 3h |

**Total Remaining:** ~14 hours of development

---

## 🎯 RECOMMENDED NEXT SESSION

1. **CallLeadModal Enhancements** (2 hours)
   - Add call timer
   - Add quick notes templates
   - Add call history tab

2. **Bulk Disposition Actions** (2 hours)
   - Create bulk update API
   - Add UI controls to leads page
   - Test with multiple leads

3. **Export to CSV** (1 hour)
   - Add to all report pages
   - Test with various data sets

**Total Next Session:** ~5 hours

---

## 📝 NOTES

- All TypeScript errors in API routes will resolve after dev server restart (Prisma Client regenerated)
- Database migration already applied successfully
- All completed features are tested and working
- Code is committed and ready for deployment

---

## 🔗 RELATED DOCUMENTATION

- Full system review: `SYSTEM_REVIEW.md`
- Detailed implementation guide: `IMPLEMENTATION_STATUS.md`
- This file: `NEXT_STEPS.md`

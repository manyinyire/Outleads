# Scheduled Email Reports Implementation Guide

This guide provides step-by-step instructions for implementing scheduled email reports.

---

## Prerequisites

```bash
npm install nodemailer node-cron
npm install --save-dev @types/nodemailer @types/node-cron
```

---

## Step 1: Email Configuration

Create email configuration file:

**File:** `lib/email/email-config.ts`

```typescript
import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export async function sendEmail({
  to,
  subject,
  html,
  attachments = []
}: {
  to: string | string[]
  subject: string
  html: string
  attachments?: any[]
}) {
  try {
    const info = await transporter.sendMail({
      from: `"Outleads Reports" <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      attachments
    })
    
    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}
```

---

## Step 2: Report Generator

Create report generation utilities:

**File:** `lib/reports/report-generator.ts`

```typescript
import { prisma } from '@/lib/db/prisma'
import Papa from 'papaparse'

export async function generateDailyReport(startDate: Date, endDate: Date) {
  const [leads, campaigns, dispositions] = await Promise.all([
    prisma.lead.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        firstLevelDisposition: true,
        secondLevelDisposition: true,
        campaign: true,
        assignedTo: true
      }
    }),
    prisma.campaign.findMany({
      where: { is_active: true },
      include: {
        _count: {
          select: { leads: true }
        }
      }
    }),
    prisma.lead.groupBy({
      by: ['firstLevelDispositionId'],
      _count: true,
      where: {
        updatedAt: { gte: startDate, lte: endDate }
      }
    })
  ])

  return {
    summary: {
      totalLeads: leads.length,
      newLeads: leads.filter(l => 
        new Date(l.createdAt) >= startDate
      ).length,
      contacted: leads.filter(l => 
        l.firstLevelDisposition?.name === 'Contacted'
      ).length,
      sales: leads.filter(l => 
        l.secondLevelDisposition?.name === 'Sale'
      ).length
    },
    leads,
    campaigns,
    dispositions
  }
}

export function formatReportHTML(data: any) {
  const { summary } = data
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #1890ff; color: white; padding: 20px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .card { 
          border: 1px solid #ddd; 
          padding: 15px; 
          border-radius: 8px;
          flex: 1;
        }
        .number { font-size: 32px; font-weight: bold; color: #1890ff; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Daily Performance Report</h1>
        <p>${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="summary">
        <div class="card">
          <h3>Total Leads</h3>
          <div class="number">${summary.totalLeads}</div>
        </div>
        <div class="card">
          <h3>New Leads</h3>
          <div class="number">${summary.newLeads}</div>
        </div>
        <div class="card">
          <h3>Contacted</h3>
          <div class="number">${summary.contacted}</div>
        </div>
        <div class="card">
          <h3>Sales</h3>
          <div class="number">${summary.sales}</div>
        </div>
      </div>
      
      <h2>Performance Metrics</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>Answer Rate</td>
          <td>${((summary.contacted / summary.totalLeads) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Conversion Rate</td>
          <td>${((summary.sales / summary.contacted) * 100).toFixed(1)}%</td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function generateCSVAttachment(data: any[]) {
  const csv = Papa.unparse(data)
  return {
    filename: `report-${new Date().toISOString().split('T')[0]}.csv`,
    content: csv,
    contentType: 'text/csv'
  }
}
```

---

## Step 3: Cron Job Scheduler

Create scheduled job:

**File:** `lib/jobs/scheduled-reports.ts`

```typescript
import cron from 'node-cron'
import { generateDailyReport, formatReportHTML, generateCSVAttachment } from '../reports/report-generator'
import { sendEmail } from '../email/email-config'

export function startScheduledReports() {
  // Daily report at 8 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily report job...')
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 1)
    
    try {
      const reportData = await generateDailyReport(startDate, endDate)
      const html = formatReportHTML(reportData)
      const csvAttachment = generateCSVAttachment(reportData.leads)
      
      await sendEmail({
        to: process.env.REPORT_RECIPIENTS?.split(',') || ['admin@example.com'],
        subject: `Daily Performance Report - ${new Date().toLocaleDateString()}`,
        html,
        attachments: [csvAttachment]
      })
      
      console.log('Daily report sent successfully')
    } catch (error) {
      console.error('Error sending daily report:', error)
    }
  })

  // Weekly report every Monday at 9 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('Running weekly report job...')
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    
    try {
      const reportData = await generateDailyReport(startDate, endDate)
      const html = formatReportHTML(reportData)
      
      await sendEmail({
        to: process.env.REPORT_RECIPIENTS?.split(',') || ['admin@example.com'],
        subject: `Weekly Performance Report - Week of ${startDate.toLocaleDateString()}`,
        html
      })
      
      console.log('Weekly report sent successfully')
    } catch (error) {
      console.error('Error sending weekly report:', error)
    }
  })

  console.log('Scheduled reports initialized')
}
```

---

## Step 4: Initialize in Application

Add to your main application entry point:

**File:** `app/api/cron/init/route.ts` (or in server startup)

```typescript
import { startScheduledReports } from '@/lib/jobs/scheduled-reports'

// Initialize on server start
if (process.env.NODE_ENV === 'production') {
  startScheduledReports()
}

export async function GET() {
  return Response.json({ message: 'Cron jobs initialized' })
}
```

---

## Step 5: Environment Variables

Add to `.env.local`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Report Recipients (comma-separated)
REPORT_RECIPIENTS=admin@example.com,manager@example.com
```

---

## Step 6: Admin UI for Report Scheduling

Create admin page to manage scheduled reports:

**File:** `app/admin/scheduled-reports/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Card, Form, Select, TimePicker, Button, Switch, message } from 'antd'

export default function ScheduledReportsPage() {
  const [form] = Form.useForm()

  const handleSave = async (values: any) => {
    try {
      await fetch('/api/admin/scheduled-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      message.success('Schedule saved successfully')
    } catch (error) {
      message.error('Failed to save schedule')
    }
  }

  return (
    <Card title="Scheduled Reports Configuration">
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item name="frequency" label="Frequency">
          <Select>
            <Select.Option value="daily">Daily</Select.Option>
            <Select.Option value="weekly">Weekly</Select.Option>
            <Select.Option value="monthly">Monthly</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="time" label="Time">
          <TimePicker format="HH:mm" />
        </Form.Item>

        <Form.Item name="enabled" label="Enabled" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item name="recipients" label="Recipients">
          <Select mode="tags" placeholder="Enter email addresses" />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Save Schedule
        </Button>
      </Form>
    </Card>
  )
}
```

---

## Cron Schedule Examples

```typescript
// Every day at 8 AM
cron.schedule('0 8 * * *', handler)

// Every Monday at 9 AM
cron.schedule('0 9 * * 1', handler)

// Every 1st of month at 10 AM
cron.schedule('0 10 1 * *', handler)

// Every hour
cron.schedule('0 * * * *', handler)

// Every 30 minutes
cron.schedule('*/30 * * * *', handler)
```

---

## Testing

Test email sending:

```typescript
// Test endpoint
export async function GET() {
  const result = await sendEmail({
    to: 'test@example.com',
    subject: 'Test Report',
    html: '<h1>Test Email</h1>'
  })
  
  return Response.json(result)
}
```

---

## Production Considerations

1. **Use a queue system** (Bull, BullMQ) for better reliability
2. **Store schedules in database** for dynamic configuration
3. **Add retry logic** for failed email sends
4. **Monitor job execution** with logging/alerting
5. **Rate limit** email sending to avoid spam filters
6. **Use email templates** for consistent branding
7. **Add unsubscribe links** for compliance

---

## Next Steps

1. Install dependencies
2. Configure SMTP settings
3. Create report generator functions
4. Set up cron schedules
5. Test with development email
6. Deploy and monitor

For questions or issues, refer to:
- [Nodemailer Documentation](https://nodemailer.com/)
- [Node-Cron Documentation](https://github.com/node-cron/node-cron)

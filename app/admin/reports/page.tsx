'use client'

import { useState } from 'react'
import { Card, Select, DatePicker, Button, Table, Row, Col, Typography, message, Spin } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import moment from 'moment'
import Papa from 'papaparse'
import { sanitizeText, sanitizeFilename } from '@/lib/utils/sanitization'

const { Title } = Typography
const { RangePicker } = DatePicker

const reportTypes = [
  { value: 'lead-details', label: 'Lead Details Report' },
  { value: 'campaign-performance', label: 'Campaign Performance Report' },
  { value: 'user-activity', label: 'User Activity Report' },
  { value: 'agent-performance', label: 'Agent Performance Report' },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null)
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleGenerateReport = async () => {
    if (!reportType) {
      message.warning('Please select a report type.')
      return
    }
    setLoading(true)
    setData([])
    setColumns([])

    try {
      const token = localStorage.getItem('auth-token')
      const url = new URL(`/api/admin/reports/${reportType}`, window.location.origin)
      if (dateRange) {
        // Set start date to beginning of day (00:00:00)
        const startDate = dateRange[0].clone().startOf('day').toISOString()
        // Set end date to end of day (23:59:59)
        const endDate = dateRange[1].clone().endOf('day').toISOString()
        url.searchParams.set('startDate', startDate)
        url.searchParams.set('endDate', endDate)
      }

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const result = await response.json()
      if (result.data && result.data.length > 0) {
        let generatedColumns: ColumnsType<any>;
        switch (reportType) {
          case 'lead-details':
            generatedColumns = [
              { title: 'Full Name', dataIndex: 'full_name', key: 'full_name', render: (text: string) => sanitizeText(text || '') },
              { title: 'Phone Number', dataIndex: 'phone_number', key: 'phone_number', render: (text: string) => sanitizeText(text || '') },
              { title: 'Business Sector', dataIndex: 'business_sector', key: 'business_sector', render: (text: string) => sanitizeText(text || '') },
              { title: 'Campaign', dataIndex: 'campaign', key: 'campaign', render: (text: string) => sanitizeText(text || '') },
              { title: 'Products', dataIndex: 'products', key: 'products', render: (text: string) => sanitizeText(text || '') },
              { title: 'Date', dataIndex: 'created_at', key: 'created_at', render: (date: string) => new Date(date).toLocaleDateString() },
            ];
            break;
          case 'campaign-performance':
            generatedColumns = [
              { title: 'Campaign Name', dataIndex: 'campaign_name', key: 'campaign_name', render: (text: string) => sanitizeText(text || '') },
              { title: 'Active', dataIndex: 'is_active', key: 'is_active', render: (active: boolean) => (active ? 'Yes' : 'No') },
              { title: 'Clicks', dataIndex: 'click_count', key: 'click_count' },
              { title: 'Leads', dataIndex: 'lead_count', key: 'lead_count' },
              { title: 'Date Created', dataIndex: 'created_at', key: 'created_at', render: (date: string) => new Date(date).toLocaleDateString() },
            ];
            break;
          case 'user-activity':
            generatedColumns = [
              { title: 'Name', dataIndex: 'name', key: 'name', render: (text: string) => sanitizeText(text || '') },
              { title: 'Email', dataIndex: 'email', key: 'email', render: (text: string) => sanitizeText(text || '') },
              { title: 'Role', dataIndex: 'role', key: 'role', render: (text: string) => sanitizeText(text || '') },
              { title: 'Status', dataIndex: 'status', key: 'status', render: (text: string) => sanitizeText(text || '') },
              { title: 'Last Login', dataIndex: 'last_login', key: 'last_login', render: (date: string) => date !== 'N/A' ? new Date(date).toLocaleString() : 'N/A' },
              { title: 'Campaigns Created', dataIndex: 'campaigns_created', key: 'campaigns_created' },
            ];
            break;
          case 'agent-performance':
            generatedColumns = [
              { title: 'Agent Name', dataIndex: 'agent_name', key: 'agent_name', render: (text: string) => sanitizeText(text || '') },
              { title: 'Email', dataIndex: 'agent_email', key: 'agent_email', render: (text: string) => sanitizeText(text || '') },
              { title: 'Campaigns', dataIndex: 'campaigns_count', key: 'campaigns_count' },
              { title: 'Total Leads', dataIndex: 'total_leads', key: 'total_leads' },
              { title: 'Called', dataIndex: 'called_leads', key: 'called_leads' },
              { title: 'Not Called', dataIndex: 'not_called_leads', key: 'not_called_leads' },
              { title: 'Contacted', dataIndex: 'contacted_leads', key: 'contacted_leads' },
              { title: 'Sales', dataIndex: 'sales_leads', key: 'sales_leads' },
              { title: 'Calling Rate', dataIndex: 'calling_rate', key: 'calling_rate', render: (rate: number) => `${rate}%` },
              { title: 'Answer Rate', dataIndex: 'answer_rate', key: 'answer_rate', render: (rate: number) => `${rate}%` },
              { title: 'Conversion Rate', dataIndex: 'conversion_rate', key: 'conversion_rate', render: (rate: number) => `${rate}%` },
            ];
            break;
          default:
            generatedColumns = []; // Should not happen
        }
        setColumns(generatedColumns);
        setData(result.data);
      } else {
        message.info('No data found for the selected criteria.')
      }
    } catch (error) {
      console.error('Report generation error:', error)
      message.error('Failed to generate report.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (data.length === 0) {
      message.warning('No data to export.')
      return
    }
    
    // Sanitize data before export
    const sanitizedData = data.map(row => {
      const sanitizedRow: any = {}
      for (const key in row) {
        if (typeof row[key] === 'string') {
          sanitizedRow[key] = sanitizeText(row[key])
        } else {
          sanitizedRow[key] = row[key]
        }
      }
      return sanitizedRow
    })
    
    const csv = Papa.unparse(sanitizedData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const safeFilename = sanitizeFilename(`${reportType}_${moment().format('YYYY-MM-DD')}`);
    link.setAttribute('download', `${safeFilename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href) // Clean up blob URL
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Reports
      </Title>

      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={8}>
            <Title level={5}>Report Type</Title>
            <Select
              style={{ width: '100%' }}
              placeholder="Select a report"
              options={reportTypes}
              onChange={setReportType}
            />
          </Col>
          <Col xs={24} md={8}>
            <Title level={5}>Date Range</Title>
            <RangePicker style={{ width: '100%' }} onChange={(dates: any) => setDateRange(dates)} />
          </Col>
          <Col xs={24} md={8}>
            <Button
              type="primary"
              onClick={handleGenerateReport}
              loading={loading}
              block
            >
              Generate Report
            </Button>
          </Col>
        </Row>
      </Card>

      <Card
        title="Report Results"
        extra={
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={data.length === 0}
          >
            Export to CSV
          </Button>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey={(record, index) => record.id || `row-${index}`}
            scroll={{ x: 'max-content' }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
          />
        )}
      </Card>
    </div>
  )
}
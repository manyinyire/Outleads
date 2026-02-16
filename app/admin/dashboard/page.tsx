'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Spin, Select } from 'antd'
import { 
  UserOutlined, 
  PhoneOutlined, 
  CheckCircleOutlined, 
  DollarOutlined,
  RiseOutlined,
  TeamOutlined,
  CampaignOutlined
} from '@ant-design/icons'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import api from '@/lib/api/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface DashboardMetrics {
  overview: {
    totalLeads: number
    calledLeads: number
    contactedLeads: number
    salesLeads: number
    activeCampaigns: number
    activeAgents: number
    recentLeads: number
  }
  rates: {
    callingRate: number
    answerRate: number
    conversionRate: number
  }
  topAgents: Array<{
    id: string
    name: string
    sales: number
  }>
  dailyStats: Array<{
    date: string
    calls: number
    contacts: number
    sales: number
  }>
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    fetchMetrics()
  }, [timeRange])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const data = await api.get(`/admin/dashboard/metrics?days=${timeRange}`)
      setMetrics(data as DashboardMetrics)
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !metrics) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  const chartData = {
    labels: metrics.dailyStats.map(d => d.date),
    datasets: [
      {
        label: 'Calls Made',
        data: metrics.dailyStats.map(d => d.calls),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      },
      {
        label: 'Contacts',
        data: metrics.dailyStats.map(d => d.contacts),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4
      },
      {
        label: 'Sales',
        data: metrics.dailyStats.map(d => d.sales),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Last 7 Days Performance'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  const topAgentsColumns = [
    {
      title: 'Rank',
      key: 'rank',
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Agent Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Sales',
      dataIndex: 'sales',
      key: 'sales',
      sorter: (a: any, b: any) => b.sales - a.sales
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <h1>Dashboard</h1>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 200 }}
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' }
            ]}
          />
        </Col>
      </Row>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Leads"
              value={metrics.overview.totalLeads}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Calling Rate"
              value={metrics.rates.callingRate}
              suffix="%"
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Answer Rate"
              value={metrics.rates.answerRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Conversion Rate"
              value={metrics.rates.conversionRate}
              suffix="%"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Campaigns"
              value={metrics.overview.activeCampaigns}
              prefix={<CampaignOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Agents"
              value={metrics.overview.activeAgents}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="New Leads (7 days)"
              value={metrics.overview.recentLeads}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Sales"
              value={metrics.overview.salesLeads}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts and Tables */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Performance Trend">
            <Line data={chartData} options={chartOptions} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Top Performing Agents">
            <Table
              columns={topAgentsColumns}
              dataSource={metrics.topAgents}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

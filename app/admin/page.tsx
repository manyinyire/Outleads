'use client'

import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag, message } from 'antd';
import { UserOutlined, BulbOutlined, TrophyOutlined, DollarOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface Lead {
  id: string;
  name: string;
  campaign: { name: string };
  status: string;
  createdAt: string;
}

interface Campaign {
  id: string;
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('auth-token');
      if (!token) {
        message.error("Authentication required.");
        setLoading(false);
        return;
      }

      try {
        // Fetch leads and campaigns in parallel
        const [leadsRes, campaignsRes] = await Promise.all([
          fetch('/api/admin/leads', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/admin/campaigns', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!leadsRes.ok || !campaignsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const leadsData = await leadsRes.json();
        const campaignsData = await campaignsRes.json();

        setLeads(leadsData.lead || []);
        setCampaigns(campaignsData.campaign || []);

      } catch (error) {
        console.error("Dashboard fetch error:", error);
        message.error('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Campaign',
      dataIndex: ['campaign', 'name'],
      key: 'campaign',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (!status) return <Tag color="default">-</Tag>;
        const colors: { [key: string]: string } = {
          new: 'blue',
          contacted: 'orange',
          qualified: 'green',
          converted: 'purple',
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Dashboard Overview
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Leads"
              value={leads.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Active Campaigns"
              value={campaigns.length}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Conversion Rate"
              value={0} // Placeholder
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Revenue Pipeline"
              value={0} // Placeholder
              prefix={<DollarOutlined />}
              suffix="M"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Recent Leads"
        style={{ marginBottom: '24px' }}
        loading={loading}
      >
        <Table
          columns={columns}
          dataSource={leads}
          pagination={false}
          size="small"
          rowKey="id"
        />
      </Card>
    </div>
  );
}

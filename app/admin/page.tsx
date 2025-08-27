'use client'

import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, message, Spin } from 'antd';
import { UserOutlined, BulbOutlined, TrophyOutlined, BarChartOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const { Title } = Typography;

interface DashboardData {
  totalLeads: number;
  activeCampaigns: number;
  leadsPerDay: Array<{ name: string; value: number }>;
  leadsPerMonth: Array<{ name: string; value: number }>;
  campaignPerformance: Array<{ name: string; value: number }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
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
        const response = await fetch('/api/admin/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const result = await response.json();
        setData(result);

      } catch (error) {
        console.error("Dashboard fetch error:", error);
        message.error('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  const topCampaign = data.campaignPerformance.sort((a, b) => b.value - a.value)[0];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Dashboard Overview
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Leads"
              value={data.totalLeads}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Campaigns"
              value={data.activeCampaigns}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Top Campaign"
              value={topCampaign ? topCampaign.name : 'N/A'}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Leads Today"
              value={data.leadsPerDay.find(d => d.name === new Date().toISOString().split('T')[0])?.value || 0}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Leads per Day (Last 30 Days)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.leadsPerDay.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" name="Leads" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Leads per Month">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.leadsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Leads" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24}>
          <Card title="Campaign Performance">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.campaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Leads" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

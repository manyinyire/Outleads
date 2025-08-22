'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Tag, Button, Space, App, Tooltip, Switch } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { CopyOutlined, PlusOutlined, ExportOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import Papa from 'papaparse'

import CrudTable, { CrudField } from '@/components/admin/CrudTable'

interface Campaign {
  id: string
  campaign_name: string
  organization_name: string
  uniqueLink: string
  lead_count: number
  click_count: number
  is_active: boolean
  createdAt: string
}

export default function CampaignsPage() {
  const [data, setData] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Campaign | null>(null)
  
  const { message } = App.useApp()
  const userRole = useSelector((state: RootState) => state.auth.user?.role)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/admin/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
      
      const result = await response.json()
      setData(Array.isArray(result) ? result : [])
      
    } catch (error) {
      console.error("Fetch error:", error)
      message.error('Failed to load campaign data.')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEdit = (record: Campaign) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('auth-token');
    try {
      const response = await fetch(`/api/admin/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        message.success('Campaign deleted successfully');
        fetchData();
      } else {
        const error = await response.json();
        message.error(error.message || 'Failed to delete campaign');
      }
    } catch (error) {
      console.error("Delete error:", error);
      message.error('An error occurred while deleting the campaign.');
    }
  }

  const handleSubmit = async (values: any, record: Campaign | null) => {
    const token = localStorage.getItem('auth-token');
    const url = record ? `/api/admin/campaigns/${record.id}` : '/api/admin/campaigns';
    const method = record ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success(`Campaign ${record ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        setEditingRecord(null);
        fetchData();
      } else {
        const error = await response.json();
        message.error(error.message || `Failed to save campaign`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error('An error occurred while saving the campaign.');
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const token = localStorage.getItem('auth-token');
    try {
      const response = await fetch(`/api/admin/campaigns/${id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        message.success(`Campaign status changed to ${currentStatus ? 'Inactive' : 'Active'}`);
        fetchData();
      } else {
        const error = await response.json();
        message.error(error.message || 'Failed to update status');
      }
    } catch (error) {
      console.error("Status toggle error:", error);
      message.error('An error occurred while updating the status.');
    }
  };

  const handleExportLeads = async (campaignId: string, campaignName: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/campaigns/${campaignId}/leads`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch leads');

      const leads = await response.json();

      // Format the data for CSV export
      const formattedLeads = leads.map((lead: any) => ({
        "Full Name": lead.fullName,
        "Phone Number": lead.phoneNumber,
        "Business Sector": lead.businessSector?.name || 'N/A',
        "Products": lead.products?.map((p: any) => p.name).join(', ') || 'N/A',
        "Date Submitted": new Date(lead.createdAt).toLocaleString(),
      }));

      if (formattedLeads.length === 0) {
        message.info('This campaign has no leads to export.');
        return;
      }

      const csv = Papa.unparse(formattedLeads);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${campaignName}-leads.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Leads exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export leads.');
    } finally {
      setLoading(false);
    }
  };

  const fields: CrudField[] = useMemo(() => [
    { name: 'campaign_name', label: 'Campaign Name', type: 'text', required: true },
    { name: 'organization_name', label: 'Organization Name', type: 'text', required: true },
  ], [])

  const columns: ColumnsType<Campaign> = useMemo(() => [
    { title: 'Campaign Name', dataIndex: 'campaign_name', key: 'campaign_name' },
    { title: 'Organization', dataIndex: 'organization_name', key: 'organization_name' },
    {
      title: 'Unique Link',
      dataIndex: 'uniqueLink',
      key: 'uniqueLink',
      render: (link: string) => {
        const fullLink = `${window.location.origin}/campaign/${link}`;
        return (
          <Space>
            <span>{fullLink}</span>
            <Tooltip title="Copy Link">
              <Button
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(fullLink);
                  message.success('Link copied to clipboard!');
                }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    { title: 'Clicks', dataIndex: 'click_count', key: 'click_count', sorter: (a, b) => a.click_count - b.click_count },
    { title: 'Leads', dataIndex: 'lead_count', key: 'lead_count', sorter: (a, b) => a.lead_count - b.lead_count },
    {
      title: 'Conversion',
      key: 'conversion',
      render: (_, record) => {
        const rate = record.click_count > 0 ? (record.lead_count / record.click_count) * 100 : 0;
        return `${rate.toFixed(2)}%`;
      },
      sorter: (a, b) => {
        const rateA = a.click_count > 0 ? (a.lead_count / a.click_count) : 0;
        const rateB = b.click_count > 0 ? (b.lead_count / b.click_count) : 0;
        return rateA - rateB;
      }
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: Campaign) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleStatus(record.id, isActive)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Edit</Button>
          <Button danger onClick={() => handleDelete(record.id)}>Delete</Button>
          <Button icon={<ExportOutlined />} onClick={() => handleExportLeads(record.id, record.campaign_name)}>
            Export Leads
          </Button>
        </Space>
      ),
    },
  ], [message])

  const hasAccess = userRole && ['ADMIN', 'TEAMLEADER'].includes(userRole)
  if (!hasAccess) {
    return <p>Access Denied</p>
  }

  return (
    <CrudTable<Campaign>
      title="Campaign Management"
      columns={columns}
      fields={fields}
      dataSource={data}
      loading={loading}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
      isModalVisible={isModalVisible}
      closeModal={() => {
        setModalVisible(false)
        setEditingRecord(null)
      }}
      editingRecord={editingRecord}
      hideDefaultActions={true} // Hide the default actions column
      customActions={
        <Button icon={<PlusOutlined />} onClick={() => {
          setEditingRecord(null);
          setModalVisible(true);
        }}>
          Create Campaign
        </Button>
      }
    />
  )
}
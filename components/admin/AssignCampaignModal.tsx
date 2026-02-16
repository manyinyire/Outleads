'use client'

import { useState, useEffect } from 'react'
import { Modal, Select, Button, App, Space } from 'antd'

interface Campaign {
  id: string
  campaign_name: string
  is_active: boolean
}

interface AssignCampaignModalProps {
  visible: boolean
  leadIds: string[]
  leadCount: number
  onClose: () => void
  onSuccess: () => void
}

export default function AssignCampaignModal({
  visible,
  leadIds,
  leadCount,
  onClose,
  onSuccess
}: AssignCampaignModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  useEffect(() => {
    if (visible) {
      fetchCampaigns()
      setSelectedCampaign(undefined)
    }
  }, [visible])

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/admin/campaigns?limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      
      const result = await response.json()
      // Only show active campaigns
      const activeCampaigns = (Array.isArray(result.data) ? result.data : [])
        .filter((c: Campaign) => c.is_active)
      setCampaigns(activeCampaigns)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      message.error('Failed to load campaigns')
    }
  }

  const handleAssign = async () => {
    if (!selectedCampaign) {
      message.warning('Please select a campaign')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/admin/leads/assign-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          leadIds,
          campaignId: selectedCampaign 
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to assign leads to campaign')
      }

      const { details } = result;
      if (details?.skipped > 0) {
        message.warning(
          `${details.assigned} lead(s) assigned successfully. ${details.skipped} lead(s) were skipped (already assigned to campaigns).`
        )
      } else {
        message.success(`Successfully assigned ${details.assigned} lead(s) to campaign!`)
      }
      
      onSuccess()
      onClose()
    } catch (error: any) {
      message.error(error.message || 'Failed to assign leads to campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={`Assign Leads to Campaign`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <div style={{ marginBottom: '1rem' }}>
        <p><strong>Selected Leads:</strong> {leadCount}</p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          Note: Only unassigned leads will be assigned. Leads already assigned to campaigns will be skipped.
        </p>
      </div>

      <Select
        placeholder="Select a campaign"
        style={{ width: '100%', marginBottom: '1rem' }}
        value={selectedCampaign}
        onChange={setSelectedCampaign}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={campaigns.map(c => ({ 
          label: c.campaign_name, 
          value: c.id 
        }))}
        size="large"
      />

      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleAssign}
          loading={loading}
          disabled={!selectedCampaign}
        >
          Assign to Campaign
        </Button>
      </Space>
    </Modal>
  )
}

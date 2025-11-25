// API Base URL - matches other API files
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type MaintenanceStatus = {
  isActive: boolean;
  mode: 'maintenance' | 'update' | 'emergency' | 'none';
  title: string;
  message: string;
  estimatedEndTime?: string;
  progress?: number;
  updates?: Array<{
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'warning' | 'success';
  }>;
};

export const fetchMaintenanceStatus = async (): Promise<MaintenanceStatus> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/status/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch maintenance status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    // Return default status if API fails
    return {
      isActive: false,
      mode: 'none',
      title: '',
      message: '',
      updates: []
    };
  }
};


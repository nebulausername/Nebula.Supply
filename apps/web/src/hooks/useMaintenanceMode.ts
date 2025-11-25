import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchMaintenanceStatus, type MaintenanceStatus } from "../api/status";

export const useMaintenanceMode = () => {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const wasInMaintenance = useRef(false);
  const previousStatusRef = useRef<MaintenanceStatus | null>(null);
  
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const data = await fetchMaintenanceStatus();
        const previousStatus = previousStatusRef.current;
        previousStatusRef.current = data;
        setStatus(data);
        
        // Only redirect if not already on maintenance page
        const isOnMaintenancePage = location.pathname === '/maintenance';
        
        // Track if we were in maintenance mode
        if (data.isActive) {
          wasInMaintenance.current = true;
        }
        
        // Redirect to maintenance page if active and not already there
        if (data.isActive && !isOnMaintenancePage) {
          navigate('/maintenance', { replace: true });
        }
        // Redirect away from maintenance page if not active
        else if (!data.isActive && isOnMaintenancePage) {
          // If we were in maintenance and now we're not, show welcome back
          if (wasInMaintenance.current && previousStatus?.isActive) {
            // Store flag to show welcome modal
            sessionStorage.setItem('showWelcomeBack', 'true');
            wasInMaintenance.current = false;
          }
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
        // On error, assume no maintenance (allow normal flow)
        setStatus({
          isActive: false,
          mode: 'none',
          title: '',
          message: '',
          updates: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkMaintenance();
    
    // Check every 30 seconds
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, [navigate, location.pathname]);
  
  return { status, loading, isMaintenanceMode: status?.isActive ?? false };
};

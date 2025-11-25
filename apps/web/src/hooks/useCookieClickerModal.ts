import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';

/**
 * Hook für Cookie Clicker Confirmation Modal
 */
export const useCookieClickerModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const openModal = useCallback(() => {
    setIsOpen(true);
    trackEvent('cookie_clicker_modal_opened', {
      source: 'manual'
    });
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    navigate('/cookie-clicker');
    trackEvent('cookie_clicker_modal_confirmed', {
      action: 'navigate_to_game'
    });
  }, [navigate]);

  return {
    isOpen,
    openModal,
    closeModal,
    handleConfirm
  };
};




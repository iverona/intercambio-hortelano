'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNotifications } from '@/context/NotificationContext';
import { useI18n } from '@/locales/provider';

type TranslationKey = 'notifications.offer_accepted.with_product' | 'notifications.offer_declined.with_product';

function getTranslationKey(notificationType: 'OFFER_ACCEPTED' | 'OFFER_REJECTED'): TranslationKey {
  const key = notificationType === 'OFFER_REJECTED' ? 'offer_declined' : 'offer_accepted';
  return `notifications.${key}.with_product` as TranslationKey;
}

const NotificationToaster = () => {
  const { notifications } = useNotifications();
  const t = useI18n();
  const processedNotifications = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      notifications.forEach((notification) => {
        if (!notification.isRead && !processedNotifications.current.has(notification.id)) {
          if (notification.type === 'OFFER_ACCEPTED' || notification.type === 'OFFER_REJECTED') {
            const message = t(getTranslationKey(notification.type), {
              productName: notification.metadata?.productName || '',
            });
            toast.info(message);
            processedNotifications.current.add(notification.id);
          }
        }
      });
    }
  }, [notifications, t]);

  return null;
};

export default NotificationToaster;

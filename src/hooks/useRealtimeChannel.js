import { useEffect, useRef } from 'react';
import { subscribeToChannel } from '../utils/realtime';

export const useRealtimeChannel = (channelName, onEvent, onStatus) => {
  const handlerRef = useRef(onEvent);
  const statusRef = useRef(onStatus);
  
  useEffect(() => {
    handlerRef.current = onEvent;
    statusRef.current = onStatus;
  }, [onEvent, onStatus]);

  useEffect(() => {
    if (!channelName) return;

    const unsubscribe = subscribeToChannel(channelName, (payload) => {
      if (handlerRef.current) handlerRef.current(payload);
    }, (status) => {
      if (statusRef.current) statusRef.current(status);
    });

    return () => {
      unsubscribe();
    };
  }, [channelName]);
};

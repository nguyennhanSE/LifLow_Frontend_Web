import { useEffect, useState, useCallback } from 'react';

interface UseTossPaymentsReturn {
  tossPayments: any | null;
  isLoading: boolean;
  error: Error | null;
  requestPayment: (
    method: string,
    paymentData: {
      orderId: string;
      amount: number;
      deliveryFee: number;
      orderName: string;
      customerKey?: string;
      customerName?: string;
      successUrl: string;
      failUrl: string;
      /** Gọi khi user đóng/reload trang thanh toán Toss (SDK reject) */
      onPaymentAborted?: (orderId: string) => void;
    }
  ) => Promise<void>;
}

const TOSS_SDK_URL = 'https://js.tosspayments.com/v2/standard';

export function useTossPayments(): UseTossPaymentsReturn {
  const [tossPayments, setTossPayments] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

    if (!clientKey) {
      setError(
        new Error(
          'TossPayments client key is not configured. Please set NEXT_PUBLIC_TOSS_CLIENT_KEY in your environment variables.'
        )
      );
      setIsLoading(false);
      return;
    }

    // Check if SDK is already loaded
    const TossPaymentsConstructor = (window as any).TossPayments;
    if (TossPaymentsConstructor) {
      try {
        const instance = TossPaymentsConstructor(clientKey);
        setTossPayments(instance);
        setIsLoading(false);
        return;
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to initialize TossPayments')
        );
        setIsLoading(false);
        return;
      }
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      `script[src="${TOSS_SDK_URL}"]`
    );
    if (existingScript) {
      // Check if SDK is already available (script already loaded)
      const TossPaymentsLoaded = (window as any).TossPayments;
      if (TossPaymentsLoaded) {
        try {
          const instance = TossPaymentsLoaded(clientKey);
          setTossPayments(instance);
          setIsLoading(false);
          return;
        } catch (err) {
          setError(
            err instanceof Error
              ? err
              : new Error('Failed to initialize TossPayments')
          );
          setIsLoading(false);
          return;
        }
      }
      
      // Wait for script to load
      const handleLoad = () => {
        try {
          const TossPayments = (window as any).TossPayments;
          if (TossPayments) {
            const instance = TossPayments(clientKey);
            setTossPayments(instance);
            setIsLoading(false);
          } else {
            setError(new Error('TossPayments SDK loaded but not available'));
            setIsLoading(false);
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err
              : new Error('Failed to initialize TossPayments')
          );
          setIsLoading(false);
        }
      };
      
      existingScript.addEventListener('load', handleLoad);
      existingScript.addEventListener('error', () => {
        setError(new Error('Failed to load TossPayments SDK'));
        setIsLoading(false);
      });
      
      return () => {
        existingScript.removeEventListener('load', handleLoad);
      };
    }

    // Load SDK script
    const script = document.createElement('script');
    script.src = TOSS_SDK_URL;
    script.async = true;

    script.onload = () => {
      try {
        const TossPayments = (window as any).TossPayments;
        if (TossPayments && typeof TossPayments === 'function') {
          const instance = TossPayments(clientKey);
          
          // Verify v2 SDK structure: instance has payment() or widgets() (requestPayment is on those, not root)
          const hasPayment = typeof instance?.payment === 'function';
          const hasWidgets = typeof instance?.widgets === 'function';
          if (instance && (hasPayment || hasWidgets)) {
            setTossPayments(instance);
            setIsLoading(false);
          } else {
            console.error('TossPayments v2 instance structure:', instance);
            console.error('Available methods:', Object.keys(instance || {}));
            setError(new Error('TossPayments v2 SDK loaded but structure is unexpected. Please check SDK version.'));
            setIsLoading(false);
          }
        } else {
          setError(new Error('TossPayments SDK loaded but constructor is not available'));
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error initializing TossPayments:', err);
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to initialize TossPayments')
        );
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      setError(new Error('Failed to load TossPayments SDK'));
      setIsLoading(false);
    };

    document.head.appendChild(script);

    // Cleanup function to remove event listeners
    return () => {
      if (script.parentNode) {
        script.onload = null;
        script.onerror = null;
      }
    };
  }, []);

  const requestPayment = useCallback(
    async (
      method: string,
      paymentData: {
        orderId: string;
        amount: number;
        orderName: string;
        customerKey?: string;
        customerName?: string;
        successUrl: string;
        failUrl: string;
        onPaymentAborted?: (orderId: string) => void;
      }
    ) => {
      if (!tossPayments) {
        throw new Error('TossPayments is not initialized');
      }

      const { onPaymentAborted } = paymentData;
      const orderId = paymentData.orderId;

      try {
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
        const isWidgetKey = clientKey.startsWith('gck_');
        const methodKey = method === '카드' || method === 'CARD' ? 'CARD' : method;

        // Build payment request options (v2 결제창 API)
        const paymentRequest: any = {
          method: methodKey,
          amount: { value: paymentData.amount, currency: 'KRW' as const },
          orderId: paymentData.orderId,
          orderName: paymentData.orderName,
          successUrl: paymentData.successUrl,
          failUrl: paymentData.failUrl,
        };
        if (paymentData.customerName) paymentRequest.customerName = paymentData.customerName;
        if (methodKey === 'CARD') {
          paymentRequest.card = { flowMode: 'DEFAULT' as const };
        }

        // 1) Widgets API: gck_ key + customerKey
        if (isWidgetKey && paymentData.customerKey && typeof tossPayments.widgets === 'function') {
          try {
            const widgets = tossPayments.widgets({ customerKey: paymentData.customerKey });
            if (typeof widgets.requestPayment === 'function') {
              await widgets.requestPayment({
                orderId: paymentRequest.orderId,
                orderName: paymentRequest.orderName,
                successUrl: paymentRequest.successUrl,
                failUrl: paymentRequest.failUrl,
                amount: paymentRequest.amount?.value,
                customerName: paymentRequest.customerName,
              });
              return;
            }
          } catch (widgetErr: any) {
            console.warn('Widgets API failed, trying payment():', widgetErr?.message);
          }
        }

        // 2) 결제창 (payment window): tossPayments.payment({ customerKey }) -> payment.requestPayment(...)
        if (typeof tossPayments.payment === 'function') {
          const customerKey = paymentData.customerKey ?? (typeof (window as any).TossPayments?.ANONYMOUS !== 'undefined' ? (window as any).TossPayments.ANONYMOUS : undefined);
          if (!customerKey) {
            throw new Error('customerKey is required for Toss Payments. Pass it in paymentData or use guest checkout.');
          }
          const payment = tossPayments.payment({ customerKey });
          if (typeof payment.requestPayment === 'function') {
            await payment.requestPayment(paymentRequest);
            return;
          }
        }

        throw new Error('TossPayments: payment() or widgets() not available. Check SDK version.');
      } catch (err) {
        console.error('Payment request error:', err);
        // User đóng/reload trang thanh toán Toss → SDK reject → gọi cancelOrderGroup
        if (onPaymentAborted && orderId) {
          onPaymentAborted(orderId);
        }
        throw err instanceof Error ? err : new Error('Payment request failed');
      }
    },
    [tossPayments]
  );

  return {
    tossPayments,
    isLoading,
    error,
    requestPayment,
  };
}

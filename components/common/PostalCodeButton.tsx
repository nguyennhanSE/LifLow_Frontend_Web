"use client"

import { useState, useRef, useEffect } from "react"
import Script from "next/script"
import { Dispatch, SetStateAction } from "react"
import { useTranslation } from 'react-i18next'

declare global {
  interface DaumPostcodeData {
    roadAddress?: string;
    jibunAddress?: string;
    sido?: string;
    sigungu?: string;
    userSelectedType?: 'R' | 'J';
    zonecode?: string;
  }
  interface DaumPostcodeConfig {
    oncomplete: (data: DaumPostcodeData) => void;
    width?: string | number;
    height?: string | number;
  }
  interface DaumPostcode {
    open: () => void;
    embed: (element: HTMLElement) => void;
  }
  interface DaumNamespace {
    Postcode: new (config: DaumPostcodeConfig) => DaumPostcode;
  }
  interface Window {
    daum?: DaumNamespace;
  }
}

interface PostalCodeButtonProps {
  onComplete: (data: { zipCode: string; addressName: string }) => void;
}

export function PostalCodeButton({ onComplete }: PostalCodeButtonProps) {
  const { t } = useTranslation()
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const postcodeEmbedRef = useRef<HTMLDivElement | null>(null);
  const modalOverlayRef = useRef<HTMLDivElement | null>(null);

  const handleFindAddress = () => {
    setIsPostcodeOpen(true);
  };

  useEffect(() => {
    if (!isPostcodeOpen) return;
    if (!window.daum?.Postcode) {
      alert('Đang tải dịch vụ tìm địa chỉ, vui lòng thử lại...');
      setIsPostcodeOpen(false);
      return;
    }
    const container = postcodeEmbedRef.current;
    if (!container) return;
    const postcode = new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        const selectedType = data.userSelectedType;
        const road = (data.roadAddress || '').trim();
        const jibun = (data.jibunAddress || '').trim();
        const zonecode = data.zonecode || '';

        let nextAddressName = '';

        if (selectedType === 'R' && road) {
          nextAddressName = road;
        } else if (selectedType === 'J' && jibun) {
          nextAddressName = jibun;
        } else {
          nextAddressName = [data.sido, data.sigungu].filter(Boolean).join(' ').trim() || road || jibun;
        }

        onComplete({
          zipCode: zonecode,
          addressName: nextAddressName,
        });
        setIsPostcodeOpen(false);
      },
      width: '100%',
      height: '100%',
    });
    postcode.embed(container);
    
    // Hide Kakao tip overlay after a short delay
    setTimeout(() => {
      // Try to find and hide tip overlays
      const tipElements = document.querySelectorAll('[class*="tip"], [id*="tip"], [class*="Tip"], [id*="Tip"]');
      tipElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style) {
          htmlEl.style.display = 'none';
          htmlEl.style.visibility = 'hidden';
        }
      });
      
      // Also try to find elements with "kakao" or "daum" in class/id
      const kakaoElements = document.querySelectorAll('[class*="kakao"], [id*="kakao"], [class*="daum"], [id*="daum"]');
      kakaoElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const text = htmlEl.textContent || '';
        // If it's a tip/guide overlay (contains "tip" or "안내" or "서비스")
        if (text.includes('tip') || text.includes('안내') || text.includes('서비스') || text.includes('Powered by')) {
          if (htmlEl.style) {
            htmlEl.style.display = 'none';
            htmlEl.style.visibility = 'hidden';
          }
        }
      });
    }, 100);
  }, [isPostcodeOpen, onComplete]);

  useEffect(() => {
    if (!isPostcodeOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPostcodeOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPostcodeOpen]);

  return (
    <>
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive"></Script>
      <button
        type="button"
        onClick={handleFindAddress}
        className="px-4 py-3 bg-white border border-gray-300 rounded whitespace-nowrap hover:bg-gray-50"
      >
        {t('key154', '주소검색')}
      </button>
      {isPostcodeOpen ? (
        <div
          ref={modalOverlayRef}
          onClick={(e) => { if (e.target === modalOverlayRef.current) setIsPostcodeOpen(false); }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/20"
          style={{ zIndex: 99999 }}
        >
          <div 
            className="bg-white w-[90vw] max-w-[600px] h-[70vh] rounded-md relative shadow-2xl"
            style={{ zIndex: 100000 }}
          >
            <button
              title={t('close', 'Close')}
              onClick={() => setIsPostcodeOpen(false)}
              className="absolute top-2 right-2 z-[100001] px-2 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50"
              style={{ zIndex: 100001 }}
            >
              {t('close', 'Close')}
            </button>
            <div 
              ref={postcodeEmbedRef} 
              className="w-full h-full rounded-b-md relative"
              style={{ zIndex: 100000 }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

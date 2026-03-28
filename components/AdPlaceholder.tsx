import React, { useEffect, useRef } from 'react';

// This makes sure we can access adsbygoogle on the window object
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdPlaceholder: React.FC<{type: 'square' | 'banner'}> = ({ type }) => {
    const adContainerRef = useRef<HTMLDivElement>(null);
    const adPushedRef = useRef(false); // Use a ref to prevent pushing the same ad multiple times

    useEffect(() => {
        const adContainer = adContainerRef.current;
        if (!adContainer) {
            return;
        }

        // This function will be called when the container is ready
        const pushAd = () => {
            // Only push the ad once per component instance
            if (adPushedRef.current) {
                return;
            }
            
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                adPushedRef.current = true; // Mark ad as pushed
            } catch (err) {
                console.error('AdSense failed to load:', err);
            }
        };

        // We use a ResizeObserver to wait until the ad container has a non-zero width.
        // This is more reliable than setTimeout for handling layout timing issues.
        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry && entry.contentRect.width > 0) {
                pushAd();
                observer.disconnect(); // Once the ad is pushed, we no longer need to observe.
            }
        });

        // Check if the container is hidden from the layout.
        if (adContainer.offsetParent === null) {
            console.log(`AdSense: Ad container for type "${type}" is hidden, not pushing ad.`);
            return;
        }

        // If the container already has a width, push the ad immediately.
        if (adContainer.offsetWidth > 0) {
            pushAd();
        } else {
            // Otherwise, observe it until it gets a width.
            observer.observe(adContainer);
        }

        return () => {
            observer.disconnect();
        };
    }, [type]);

    const adClient = "ca-pub-4183308404203808";
    const adSlot = "3673232296";

    const containerClasses = type === 'banner'
        ? "w-full min-h-[90px] bg-gray-200 dark:bg-gray-700 rounded-lg"
        : "w-full min-h-[250px] bg-gray-200 dark:bg-gray-700 rounded-lg";

    return (
      <div ref={adContainerRef} className={containerClasses}>
        <ins className="adsbygoogle w-full"
             style={{ display: 'block' }}
             data-ad-client={adClient}
             data-ad-slot={adSlot}
             data-ad-format="auto"
             data-full-width-responsive="false"></ins>
      </div>
    );
};

export default AdPlaceholder;

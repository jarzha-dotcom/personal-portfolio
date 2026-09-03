import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    children: React.ReactNode;
}

export const Portal: React.FC<PortalProps> = ({ children }) => {
    const [container] = useState(() => document.createElement('div'));

    useEffect(() => {
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.zIndex = '9999';
        container.style.pointerEvents = 'none'; // biar klik tembus ke background

        document.body.appendChild(container);

        return () => {
            document.body.removeChild(container);
        };
    }, [container]);

    // Wrapper dengan pointerEvents auto supaya modal bisa diklik
    return createPortal(
        <div style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}>
            {children}
        </div>,
        container
    );
};
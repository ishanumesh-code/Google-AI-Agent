import React, { useEffect, useRef, useState } from 'react';

/**
 * HtmlEmailFrame
 * 
 * Exact HTML email renderer:
 * - Uses isolated sandboxed iframe (<iframe srcDoc={...}>)
 * - Isolates email CSS styles so they don't leak or break app styling
 * - Auto-measures scroll height to expand naturally
 * - Injects <base target="_blank"> so clicked email links open in new tab safely
 */
export default function HtmlEmailFrame({ htmlContent }) {
  const iframeRef = useRef(null);
  const [frameHeight, setFrameHeight] = useState(400);

  const prepareHtml = (rawHtml) => {
    if (!rawHtml || !rawHtml.trim()) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #6b7280; font-size: 14px; padding: 24px; }
          </style>
        </head>
        <body>
          <em>(This email has no HTML body content)</em>
        </body>
        </html>
      `;
    }

    const hasHead = /<head[^>]*>/i.test(rawHtml);
    const baseTarget = '<base target="_blank">';
    const baseStyles = `
      <style>
        body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; word-wrap: break-word; }
        img { max-width: 100%; height: auto; }
      </style>
    `;

    if (hasHead) {
      return rawHtml.replace(/<head[^>]*>/i, `$&${baseTarget}${baseStyles}`);
    } else {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseTarget}
          ${baseStyles}
        </head>
        <body>
          ${rawHtml}
        </body>
        </html>
      `;
    }
  };

  const processedHtml = prepareHtml(htmlContent);

  const handleIframeLoad = () => {
    try {
      const doc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
      if (doc && doc.body) {
        const contentHeight = Math.max(
          doc.body.scrollHeight,
          doc.documentElement.scrollHeight,
          doc.body.offsetHeight
        );
        if (contentHeight > 50) {
          setFrameHeight(contentHeight + 30);
        }
      }
    } catch (err) {
      console.warn("Unable to calculate iframe height:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(handleIframeLoad, 200);
    return () => clearTimeout(timer);
  }, [htmlContent]);

  return (
    <div className="email-frame-container" style={{ width: '100%', minHeight: '300px' }}>
      <iframe
        ref={iframeRef}
        srcDoc={processedHtml}
        title="Email Body"
        onLoad={handleIframeLoad}
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        style={{
          width: '100%',
          height: `${frameHeight}px`,
          border: 'none',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          display: 'block'
        }}
      />
    </div>
  );
}

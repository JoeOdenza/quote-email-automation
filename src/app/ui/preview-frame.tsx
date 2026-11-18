"use client";

import { useEffect, useRef } from "react";

// Shows an email's HTML in a frame that keeps its scroll position when the
// HTML changes (e.g. picking another colour scheme), instead of jumping back
// to the top each time the preview is redrawn.
//
// "allow-same-origin" lets this page read and set the frame's scroll. Scripts
// stay blocked (no "allow-scripts"), so the email still can't run anything.
export function PreviewFrame({ html, title, className }: { html: string; title: string; className?: string }) {
    const frameRef = useRef<HTMLIFrameElement>(null);
    const scrollTop = useRef(0);

    // Each new document needs its own scroll listener.
    function trackScroll(win: Window) {
        win.addEventListener("scroll", () => {
            scrollTop.current = win.scrollY;
        });
    }

    // Runs each time new HTML has loaded, pictures included, so the page is
    // full height before scrolling back.
    function onLoad() {
        const win = frameRef.current?.contentWindow;
        if (!win) return;
        win.scrollTo(0, scrollTop.current);
        trackScroll(win);
    }

    // The first preview can finish loading before this page's code is ready,
    // so its load event is missed; start tracking it here instead.
    useEffect(() => {
        const win = frameRef.current?.contentWindow;
        if (win?.document.readyState === "complete") trackScroll(win);
    }, []);

    return (
        <iframe
            ref={frameRef}
            srcDoc={html}
            title={title}
            sandbox="allow-same-origin"
            onLoad={onLoad}
            className={className}
        />
    );
}

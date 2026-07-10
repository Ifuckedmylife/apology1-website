// ===== Typewriter Effect =====
// Types out text character-by-character with a blinking cursor.
// Supports two modes:
//   1. leave.html: elements with [data-typewriter] type sequentially on load
//   2. index.html: elements with [data-typewriter-page] type when their page becomes active

(function () {
    'use strict';

    const TYPE_SPEED = 35;        // ms per character
    const PAUSE_BETWEEN = 400;    // ms pause between elements
    const INITIAL_DELAY = 1600;   // ms before first element starts (wait for reveal animations)

    const typedPages = new Set();  // track which pages already typed

    function typeText(element, text, callback) {
        let index = 0;

        // Mark as typing (makes it visible)
        element.classList.add('typing');
        element.textContent = '';

        // Add cursor
        const cursor = document.createElement('span');
        cursor.classList.add('typewriter-cursor');
        element.appendChild(cursor);

        function typeNextChar() {
            if (index < text.length) {
                // Insert text before cursor
                const textNode = document.createTextNode(text.charAt(index));
                element.insertBefore(textNode, cursor);
                index++;

                // Slightly variable speed for realism
                const variation = Math.random() * 30 - 15; // ±15ms
                const charDelay = text.charAt(index - 1) === ' ' ? TYPE_SPEED + 10 : TYPE_SPEED;

                // Longer pause after punctuation
                let pause = 0;
                const lastChar = text.charAt(index - 1);
                if (lastChar === '.' || lastChar === '!' || lastChar === '?') {
                    pause = 300;
                } else if (lastChar === ',' || lastChar === ';' || lastChar === ':') {
                    pause = 150;
                } else if (lastChar === '—' || lastChar === '–') {
                    pause = 200;
                }

                setTimeout(typeNextChar, charDelay + variation + pause);
            } else {
                // Done typing this element — hide cursor
                cursor.classList.add('hidden');
                if (callback) {
                    setTimeout(callback, PAUSE_BETWEEN);
                }
            }
        }

        typeNextChar();
    }

    function typeSequence(elements, delay) {
        if (elements.length === 0) return;

        // Sort by order attribute
        elements.sort((a, b) => {
            const orderA = parseInt(a.getAttribute('data-typewriter-order') || '0', 10);
            const orderB = parseInt(b.getAttribute('data-typewriter-order') || '0', 10);
            return orderA - orderB;
        });

        let currentIndex = 0;

        function typeNext() {
            if (currentIndex >= elements.length) return;

            const el = elements[currentIndex];
            const text = el.getAttribute('data-typewriter');
            currentIndex++;

            typeText(el, text, typeNext);
        }

        setTimeout(typeNext, delay);
    }

    // ===== Mode 1: leave.html — type all on load =====
    function initLeavePageTypewriter() {
        const elements = Array.from(
            document.querySelectorAll('[data-typewriter]:not([data-typewriter-page])')
        );
        if (elements.length === 0) return;
        typeSequence(elements, INITIAL_DELAY);
    }

    // ===== Mode 2: index.html — type when page becomes active =====
    function initPagedTypewriter() {
        const pagedElements = document.querySelectorAll('[data-typewriter-page]');
        if (pagedElements.length === 0) return;

        // Watch for page transitions via MutationObserver on .page elements
        const pages = document.querySelectorAll('.page');

        pages.forEach(page => {
            const observer = new MutationObserver(() => {
                if (page.classList.contains('active')) {
                    // Find the page index from the id (e.g. "page-1" → "1")
                    const pageId = page.id; // e.g. "page-1"
                    const pageNum = pageId.replace('page-', '');

                    if (typedPages.has(pageNum)) return;
                    typedPages.add(pageNum);

                    const elements = Array.from(
                        page.querySelectorAll('[data-typewriter-page="' + pageNum + '"]')
                    );
                    if (elements.length > 0) {
                        typeSequence(elements, 800); // shorter delay since reveal anim is faster
                    }
                }
            });

            observer.observe(page, { attributes: true, attributeFilter: ['class'] });
        });
    }

    // ===== Initialize =====
    function init() {
        initLeavePageTypewriter();
        initPagedTypewriter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

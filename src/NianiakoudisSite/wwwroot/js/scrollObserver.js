export function observeLastRow(dotNetHelper) {
    const scrollButton = document.getElementById('scroll-top-button');
    const content = document.querySelector('.content');

    if (!scrollButton || !content) {
        console.warn('Scroll button or content not found');
        return;
    }

    function checkScrollPosition() {
        const scrollTop = content.scrollTop;
        const scrollHeight = content.scrollHeight;
        const clientHeight = content.clientHeight;

        // Show button when user has scrolled to within 100px of the bottom
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

        if (isNearBottom) {
            scrollButton.classList.add('visible');
        } else {
            scrollButton.classList.remove('visible');
        }
    }

    // Check initial position
    checkScrollPosition();

    // Listen for scroll events
    content.addEventListener('scroll', checkScrollPosition);
}

export function initScrollAnimations(dotNetHelper) {
    const content = document.querySelector('.content');
    const rows = Array.from(document.querySelectorAll('.home-row'));
    const sections = Array.from(document.querySelectorAll('.hero, .home-row'));
    const pagerDots = Array.from(document.querySelectorAll('.pager-dot'));

    if (!content || rows.length === 0 || !dotNetHelper) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const index = Number(entry.target.dataset.rowIndex || 0);
                dotNetHelper.invokeMethodAsync('SetRowVisible', index, entry.isIntersecting);
            });
        },
        {
            root: content,
            threshold: 0.25
        }
    );

    const smoothScrollTo = (targetTop, durationMs) => {
        const startTop = content.scrollTop;
        const distance = targetTop - startTop;
        const startTime = window.performance.now();

        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            content.scrollTop = startTop + distance * eased;
            if (progress < 1) {
                window.requestAnimationFrame(tick);
            }
        };

        window.requestAnimationFrame(tick);
    };

    const startAutoRotate = () => {
        let currentIndex = 0;
        let pauseUntil = 0;
        const pauseRotation = () => {
            pauseUntil = window.performance.now() + 15000;
        };
        const setNextIndexFromSection = (sectionIndex) => {
            if (sections.length === 0) {
                return;
            }
            const safeIndex = Math.max(0, Math.min(sections.length - 1, sectionIndex));
            currentIndex = (safeIndex + 1) % sections.length;
        };

        window.setInterval(() => {
            if (sections.length === 0) {
                return;
            }
            if (window.performance.now() < pauseUntil) {
                return;
            }
            const target = sections[currentIndex % sections.length];
            currentIndex += 1;
            if (target) {
                smoothScrollTo(Math.max(0, target.offsetTop), 2000);
            }
        }, 8000);

        return { pauseRotation, setNextIndexFromSection };
    };

    window.requestAnimationFrame(() => {
        rows.forEach((row, index) => {
            row.dataset.rowIndex = String(index);
            observer.observe(row);
        });
        const rotation = startAutoRotate();
        content.addEventListener('wheel', rotation.pauseRotation, { passive: true });
        content.addEventListener('touchstart', rotation.pauseRotation, { passive: true });
        content.addEventListener('keydown', rotation.pauseRotation);
        pagerDots.forEach((dot) => {
            const index = Number(dot.dataset.sectionIndex);
            if (Number.isNaN(index) || !sections[index]) {
                return;
            }
            dot.addEventListener('click', () => {
                rotation.pauseRotation();
                rotation.setNextIndexFromSection(index);
                smoothScrollTo(Math.max(0, sections[index].offsetTop), 1600);
            });
        });
    });
}

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
    const rowsContainer = document.querySelector('.home-rows');
    const sections = Array.from(document.querySelectorAll('.hero, .home-row'));
    const pagerDots = Array.from(document.querySelectorAll('.pager-dot'));

    if (!content || rows.length === 0 || !dotNetHelper) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const index = Number(entry.target.dataset.rowIndex || 0);
                if (entry.isIntersecting) {
                    dotNetHelper.invokeMethodAsync('SetRowVisible', index, true);
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            root: content,
            threshold: 0.25
        }
    );

    if (rowsContainer) {
        const containerObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        containerObserver.unobserve(entry.target);
                    }
                });
            },
            {
                root: content,
                threshold: 0.15
            }
        );
        containerObserver.observe(rowsContainer);
    }

    let activeAnimation = null;
    const getTargetTop = (target) => {
        const contentRect = content.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        return content.scrollTop + (targetRect.top - contentRect.top);
    };
    const smoothScrollTo = (target, durationMs) => {
        if (!target) {
            return;
        }
        if (activeAnimation) {
            window.cancelAnimationFrame(activeAnimation.frameId);
        }
        const targetTop = getTargetTop(target);
        const startTop = content.scrollTop;
        const distance = targetTop - startTop;
        const startTime = window.performance.now();
        const animation = { frameId: 0 };

        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            content.scrollTop = startTop + distance * eased;
            if (progress < 1) {
                animation.frameId = window.requestAnimationFrame(tick);
            } else {
                activeAnimation = null;
            }
        };

        activeAnimation = animation;
        animation.frameId = window.requestAnimationFrame(tick);
    };

    const jumpTo = (target) => {
        if (!target) {
            return;
        }
        if (activeAnimation) {
            window.cancelAnimationFrame(activeAnimation.frameId);
            activeAnimation = null;
        }
        content.scrollTop = getTargetTop(target);
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
            const targetIndex = currentIndex % sections.length;
            const target = sections[targetIndex];
            currentIndex += 1;
            if (target) {
                if (currentIndex > sections.length && targetIndex === 0) {
                    jumpTo(target);
                } else {
                    smoothScrollTo(target, 2000);
                }
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
                jumpTo(sections[index]);
            });
        });
    });
}

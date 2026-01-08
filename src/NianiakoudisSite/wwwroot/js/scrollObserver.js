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

    const startAutoRotate = () => {
        let currentIndex = 0;
        let pauseUntil = 0;
        const pauseRotation = () => {
            pauseUntil = window.performance.now() + 30000;
        };

        window.setInterval(() => {
            if (rows.length === 0) {
                return;
            }
            if (window.performance.now() < pauseUntil) {
                return;
            }
            const target = rows[currentIndex % rows.length];
            currentIndex += 1;
            if (target) {
                content.scrollTo({ top: Math.max(0, target.offsetTop), behavior: 'smooth' });
            }
        }, 8000);

        return pauseRotation;
    };

    window.requestAnimationFrame(() => {
        rows.forEach((row, index) => {
            row.dataset.rowIndex = String(index);
            observer.observe(row);
        });
        const pauseRotation = startAutoRotate();
        content.addEventListener('wheel', pauseRotation, { passive: true });
        content.addEventListener('touchstart', pauseRotation, { passive: true });
        content.addEventListener('keydown', pauseRotation);
    });
}

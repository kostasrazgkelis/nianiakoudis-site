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
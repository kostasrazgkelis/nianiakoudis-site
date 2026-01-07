(() => {
    const scrollContainer = document.querySelector(".home-scroll");
    const rows = document.querySelectorAll(".home-row");

    if (!scrollContainer || rows.length === 0) {
        return;
    }

    document.body.classList.add("scroll-animate");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                }
            });
        },
        {
            root: scrollContainer,
            threshold: 0.25
        }
    );

    rows.forEach((row) => observer.observe(row));

    window.scrollHomeTop = () => {
        scrollContainer.scrollTo({ top: 0, behavior: "auto" });
    };
})();

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

    rows.forEach((row, index) => {
        observer.observe(row);

        row.addEventListener("click", (event) => {
            if (event.target.closest("a, button")) {
                return;
            }
            const nextRow = rows[index + 1];
            if (nextRow) {
                nextRow.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    window.scrollHomeTop = () => {
        rows[0]?.scrollIntoView({ behavior: "auto", block: "start" });
        scrollContainer.scrollTop = 0;
    };
})();

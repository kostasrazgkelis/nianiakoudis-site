(() => {
    const scrollContainer = document.querySelector(".home-scroll");
    const rows = document.querySelectorAll(".home-row");
    const footer = document.querySelector(".home-scroll-footer");

    if (!scrollContainer || rows.length === 0) {
        return;
    }

    document.body.classList.add("scroll-animate");
    document.body.classList.add("home-scrollbars-hidden");
    const seenRows = new Set();

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    seenRows.add(entry.target);
                }
            });
            if (footer) {
                footer.classList.toggle("is-visible", seenRows.size === rows.length);
            }
        },
        {
            root: scrollContainer,
            threshold: 0.25
        }
    );

    const setFocusedRow = () => {
        let closestRow = rows[0];
        let closestDistance = Number.POSITIVE_INFINITY;

        rows.forEach((row) => {
            const distance = Math.abs(row.offsetTop - scrollContainer.scrollTop);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestRow = row;
            }
        });

        rows.forEach((row) => row.classList.toggle("is-focused", row === closestRow));
    };

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

    scrollContainer.addEventListener("scroll", () => {
        window.requestAnimationFrame(setFocusedRow);
    });

    setFocusedRow();

    window.scrollHomeTop = () => {
        rows[0]?.scrollIntoView({ behavior: "smooth", block: "start" });
        setFocusedRow();
    };
})();

window.homeSectionsObserver = {
    init: function (selector) {
        var items = document.querySelectorAll(selector);
        if (!items.length) {
            return;
        }

        var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        items.forEach(function (item) {
            observer.observe(item);
        });
    }
};

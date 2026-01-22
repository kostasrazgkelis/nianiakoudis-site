window.homeSectionsObserver = {
    init: function (selector) {
        var items = document.querySelectorAll(selector);
        if (!items.length) {
            return;
        }

        var flowStartDelayMs = 1000;

        function parseDuration(value) {
            if (!value) {
                return null;
            }
            var trimmed = value.trim();
            if (!trimmed) {
                return null;
            }
            if (trimmed.endsWith("ms")) {
                var msValue = parseFloat(trimmed.slice(0, -2));
                return Number.isFinite(msValue) ? msValue : null;
            }
            if (trimmed.endsWith("s")) {
                var secondsValue = parseFloat(trimmed.slice(0, -1));
                return Number.isFinite(secondsValue) ? (secondsValue * 1000) : null;
            }
            var numericValue = parseFloat(trimmed);
            return Number.isFinite(numericValue) ? numericValue : null;
        }

        function getFlowDuration(flow) {
            var motion = flow.querySelector(".home-flow-head-motion");
            var duration = motion ? parseDuration(motion.getAttribute("dur")) : null;
            return duration || 5500;
        }

        function mapClientToViewBox(svgRect, viewBox, x, y) {
            if (!svgRect.width || !svgRect.height) {
                return null;
            }
            var relativeX = (x - svgRect.left) / svgRect.width;
            var relativeY = (y - svgRect.top) / svgRect.height;
            return {
                x: viewBox.x + (relativeX * viewBox.width),
                y: viewBox.y + (relativeY * viewBox.height)
            };
        }

        function clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }

        function mapViewBoxToClient(svgRect, viewBox, point) {
            if (!svgRect.width || !svgRect.height) {
                return null;
            }
            var relativeX = (point.x - viewBox.x) / viewBox.width;
            var relativeY = (point.y - viewBox.y) / viewBox.height;
            return {
                x: svgRect.left + (relativeX * svgRect.width),
                y: svgRect.top + (relativeY * svgRect.height)
            };
        }

        function pointInsideRect(point, rect, padding) {
            var inset = padding || 0;
            return (
                point.x >= (rect.left - inset) &&
                point.x <= (rect.right + inset) &&
                point.y >= (rect.top - inset) &&
                point.y <= (rect.bottom + inset)
            );
        }

        function findIntersectingLength(path, rect, svgRect, viewBox, totalLength, samples, padding) {
            var step = totalLength / samples;
            for (var i = 0; i <= samples; i++) {
                var length = i * step;
                var point = path.getPointAtLength(length);
                var clientPoint = mapViewBoxToClient(svgRect, viewBox, point);
                if (clientPoint && pointInsideRect(clientPoint, rect, padding)) {
                    return length;
                }
            }
            return null;
        }

        function buildRoundedPath(points, radius) {
            if (!points || points.length < 2) {
                return "";
            }

            var d = "M" + points[0].x + " " + points[0].y;
            for (var i = 1; i < points.length; i++) {
                var prev = points[i - 1];
                var curr = points[i];
                var next = (i + 1 < points.length) ? points[i + 1] : null;

                if (!next) {
                    d += " L" + curr.x + " " + curr.y;
                    continue;
                }

                var prevLen = Math.abs(curr.x - prev.x) + Math.abs(curr.y - prev.y);
                var nextLen = Math.abs(next.x - curr.x) + Math.abs(next.y - curr.y);
                var cornerRadius = Math.min(radius, prevLen / 2, nextLen / 2);

                if (cornerRadius <= 0) {
                    d += " L" + curr.x + " " + curr.y;
                    continue;
                }

                var entry = { x: curr.x, y: curr.y };
                if (prev.x === curr.x) {
                    entry.y = curr.y - (Math.sign(curr.y - prev.y) * cornerRadius);
                } else {
                    entry.x = curr.x - (Math.sign(curr.x - prev.x) * cornerRadius);
                }

                var exit = { x: curr.x, y: curr.y };
                if (next.x === curr.x) {
                    exit.y = curr.y + (Math.sign(next.y - curr.y) * cornerRadius);
                } else {
                    exit.x = curr.x + (Math.sign(next.x - curr.x) * cornerRadius);
                }

                d += " L" + entry.x + " " + entry.y;
                d += " Q" + curr.x + " " + curr.y + " " + exit.x + " " + exit.y;
            }

            return d;
        }

        function updateFlowPath(flow) {
            var svg = flow.querySelector(".home-flow-line");
            var track = flow.querySelector(".home-flow-track");
            var trail = flow.querySelector(".home-flow-trail");
            var containerNodes = Array.prototype.slice.call(flow.querySelectorAll(".home-container"));
            if (!svg || !track || !trail || containerNodes.length < 1) {
                return false;
            }

            var svgRect = svg.getBoundingClientRect();
            var viewBox = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : { x: 0, y: 0, width: 100, height: 100 };
            if (!svgRect.width || !svgRect.height) {
                return false;
            }

            var scaleX = svgRect.width / viewBox.width;
            var scaleY = svgRect.height / viewBox.height;
            if (scaleX && scaleY) {
                flow.style.setProperty("--flow-head-scale-x", (scaleY / scaleX).toFixed(4));
            }

            var ordered = containerNodes.slice();
            var hasIndex = ordered.some(function (container) {
                return container.hasAttribute("data-flow-index");
            });
            if (hasIndex) {
                ordered.sort(function (a, b) {
                    var aIndex = parseInt(a.getAttribute("data-flow-index") || "0", 10);
                    var bIndex = parseInt(b.getAttribute("data-flow-index") || "0", 10);
                    if (Number.isNaN(aIndex) || Number.isNaN(bIndex)) {
                        return 0;
                    }
                    return aIndex - bIndex;
                });
            }

            var centers = [];
            ordered.forEach(function (container) {
                var rect = container.getBoundingClientRect();
                var mapped = mapClientToViewBox(
                    svgRect,
                    viewBox,
                    rect.left + (rect.width / 2),
                    rect.top + (rect.height / 2)
                );
                if (mapped) {
                    centers.push(mapped);
                }
            });

            if (centers.length < 1) {
                return false;
            }

            var points = [centers[0]];
            for (var i = 1; i < centers.length; i++) {
                var prevPoint = points[points.length - 1];
                var nextPoint = centers[i];
                if (prevPoint.x !== nextPoint.x && prevPoint.y !== nextPoint.y) {
                    points.push({ x: nextPoint.x, y: prevPoint.y });
                }
                points.push(nextPoint);
            }

            var minX = centers[0].x;
            var maxX = centers[0].x;
            var minY = centers[0].y;
            var maxY = centers[0].y;
            centers.forEach(function (center) {
                minX = Math.min(minX, center.x);
                maxX = Math.max(maxX, center.x);
                minY = Math.min(minY, center.y);
                maxY = Math.max(maxY, center.y);
            });

            var spanX = maxX - minX;
            var spanY = maxY - minY;
            var radius = Math.min(spanX, spanY) * 0.12;
            radius = clamp(radius, 2, 10);

            var d = buildRoundedPath(points, radius);
            if (!d) {
                return false;
            }

            track.setAttribute("d", d);
            trail.setAttribute("d", d);
            return true;
        }

        function positionFlowHeadAtStart(flow) {
            var track = flow.querySelector(".home-flow-track");
            var head = flow.querySelector(".home-flow-head");
            if (!track || !head || typeof track.getPointAtLength !== "function") {
                return;
            }
            var startPoint = track.getPointAtLength(0);
            head.setAttribute("transform", "translate(" + startPoint.x + " " + startPoint.y + ")");
        }

        function resetFlowTrail(flow) {
            syncFlowTrailLength(flow, false);
        }

        function syncFlowTrailLength(flow, preserveOffset) {
            var trails = flow.querySelectorAll(".home-flow-trail");
            trails.forEach(function (trail) {
                var length = trail.getTotalLength();
                trail.style.strokeDasharray = length;
                trail.style.setProperty("--flow-length", length);
                var draws = trail.querySelectorAll(".home-flow-trail-draw");
                draws.forEach(function (draw) {
                    draw.setAttribute("from", length);
                    draw.setAttribute("to", 0);
                });
                if (!preserveOffset) {
                    trail.style.strokeDashoffset = length;
                }
            });
        }

        function findNearestLength(path, target, totalLength, samples) {
            var bestLength = 0;
            var bestDistance = Infinity;
            for (var i = 0; i <= samples; i++) {
                var length = (i / samples) * totalLength;
                var point = path.getPointAtLength(length);
                var dx = point.x - target.x;
                var dy = point.y - target.y;
                var distance = (dx * dx) + (dy * dy);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestLength = length;
                }
            }

            var refineStep = totalLength / (samples * 8);
            var start = Math.max(0, bestLength - (refineStep * 6));
            var end = Math.min(totalLength, bestLength + (refineStep * 6));
            for (var refine = start; refine <= end; refine += refineStep) {
                var refinePoint = path.getPointAtLength(refine);
                var refineDx = refinePoint.x - target.x;
                var refineDy = refinePoint.y - target.y;
                var refineDistance = (refineDx * refineDx) + (refineDy * refineDy);
                if (refineDistance < bestDistance) {
                    bestDistance = refineDistance;
                    bestLength = refine;
                }
            }

            return bestLength;
        }

        function scheduleFlowContainers(flow) {
            var containers = flow.querySelectorAll(".home-container");
            if (!containers.length) {
                return;
            }

            var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (prefersReducedMotion) {
                containers.forEach(function (container) {
                    container.classList.add("is-visible");
                });
                return;
            }

            var svg = flow.querySelector(".home-flow-line");
            var path = flow.querySelector(".home-flow-track");
            if (!svg || !path) {
                containers.forEach(function (container) {
                    container.classList.add("is-visible");
                });
                return;
            }

            var svgRect = svg.getBoundingClientRect();
            var viewBox = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : { x: 0, y: 0, width: 100, height: 100 };
            var totalLength = path.getTotalLength();
            if (!totalLength) {
                containers.forEach(function (container) {
                    container.classList.add("is-visible");
                });
                return;
            }

            var durationMs = getFlowDuration(flow);
            var samples = 320;
            var intersectionSamples = 640;
            var intersectionPadding = 6;

            containers.forEach(function (container) {
                var rect = container.getBoundingClientRect();
                var lengthAt = findIntersectingLength(
                    path,
                    rect,
                    svgRect,
                    viewBox,
                    totalLength,
                    intersectionSamples,
                    intersectionPadding
                );
                if (lengthAt === null) {
                    var target = mapClientToViewBox(
                        svgRect,
                        viewBox,
                        rect.left + (rect.width / 2),
                        rect.top + (rect.height / 2)
                    );
                    if (!target) {
                        container.classList.add("is-visible");
                        return;
                    }
                    lengthAt = findNearestLength(path, target, totalLength, samples);
                }
                var delay = Math.max(0, Math.round((lengthAt / totalLength) * durationMs));
                window.setTimeout(function () {
                    container.classList.add("is-visible");
                }, delay);
            });
        }

        function startFlow(flow) {
            if (flow.dataset.flowStarted === "1") {
                updateFlowPath(flow);
                syncFlowTrailLength(flow, true);
                return;
            }

            updateFlowPath(flow);
            resetFlowTrail(flow);
            positionFlowHeadAtStart(flow);
            flow.dataset.flowStarted = "1";
            var head = flow.querySelector(".home-flow-head");
            var motions = flow.querySelectorAll(".home-flow-head-motion");
            var draws = flow.querySelectorAll(".home-flow-trail-draw");
            window.setTimeout(function () {
                if (head) {
                    head.removeAttribute("transform");
                }
                motions.forEach(function (motion) {
                    if (typeof motion.beginElement === "function") {
                        motion.beginElement();
                    }
                });
                draws.forEach(function (draw) {
                    if (typeof draw.beginElement === "function") {
                        draw.beginElement();
                    }
                });
            }, flowStartDelayMs);
            scheduleFlowContainers(flow);
        }

        function handleLayoutChange() {
            items.forEach(function (item) {
                if (!item.classList.contains("home-flow")) {
                    return;
                }
                updateFlowPath(item);
                var started = item.dataset.flowStarted === "1";
                syncFlowTrailLength(item, started);
            });
        }

        items.forEach(function (item) {
            if (item.classList.contains("home-flow")) {
                updateFlowPath(item);
                resetFlowTrail(item);
            }
        });

        var resizeTimer = null;
        function queueLayoutChange() {
            if (resizeTimer) {
                window.clearTimeout(resizeTimer);
            }
            resizeTimer = window.setTimeout(function () {
                resizeTimer = null;
                handleLayoutChange();
            }, 150);
        }

        window.addEventListener("resize", queueLayoutChange);
        window.addEventListener("orientationchange", queueLayoutChange);

        var isNarrowScreen = window.matchMedia && window.matchMedia("(max-width: 900px)").matches;
        var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    if (entry.target.classList.contains("home-flow")) {
                        startFlow(entry.target);
                    }
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: isNarrowScreen ? 0 : 0.2 });

        items.forEach(function (item) {
            observer.observe(item);
        });
    }
};

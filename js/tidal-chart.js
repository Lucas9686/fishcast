/**
 * PETRI HEIL - Tidal Timeline Canvas Renderer
 *
 * Renders a smooth tidal curve showing high/low water events
 * throughout the day with time markers and height values.
 *
 * @module tidal-chart
 */

/**
 * Draw tidal timeline curve on canvas
 *
 * Displays:
 * - Smooth sinusoidal tidal curve interpolated between high/low events
 * - Gradient fill below the curve (water blue to transparent)
 * - Markers for high/low tides with time and height labels
 * - Time axis with hour markers (00:00, 06:00, 12:00, 18:00)
 *
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {Array<{time: string, height: number, type: 'high'|'low'}>} tides - Tide events for the day (2-4 events typically)
 * @param {number} dayStartHour - Start hour (0-23), typically 0
 * @param {number} dayEndHour - End hour (0-23), typically 23
 */
function drawTidalTimeline(canvas, tides, dayStartHour = 0, dayEndHour = 23) {
    // Get 2D context
    const ctx = canvas.getContext('2d');

    // Handle high-DPI displays for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = canvas.offsetWidth;
    const logicalHeight = canvas.offsetHeight;

    // Set canvas size accounting for device pixel ratio
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    // Define padding
    const padding = { top: 14, right: 10, bottom: 20, left: 10 };
    const chartWidth = logicalWidth - padding.left - padding.right;
    const chartHeight = logicalHeight - padding.top - padding.bottom;

    // Handle edge case: no tide data
    if (!tides || tides.length === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Keine Gezeitendaten', logicalWidth / 2, logicalHeight / 2);
        return;
    }

    // Parse tide times to decimal hours
    const tidesWithHours = tides.map(tide => {
        const tideDate = new Date(tide.time);
        const hour = tideDate.getHours() + tideDate.getMinutes() / 60;
        return {
            ...tide,
            hour: hour,
            date: tideDate
        };
    });

    // Sort by hour
    tidesWithHours.sort((a, b) => a.hour - b.hour);

    // Generate smooth tidal curve using cosine interpolation
    const hourSpan = dayEndHour - dayStartHour + 1; // Total hours to display
    const interpolatedPoints = [];

    for (let h = 0; h <= hourSpan; h++) {
        const hour = dayStartHour + h;

        // Find bounding tide events for this hour
        let prevTide = null;
        let nextTide = null;

        for (let i = 0; i < tidesWithHours.length; i++) {
            if (tidesWithHours[i].hour <= hour) {
                prevTide = tidesWithHours[i];
            }
            if (tidesWithHours[i].hour > hour && nextTide === null) {
                nextTide = tidesWithHours[i];
            }
        }

        // Handle edge cases: extrapolate before first or after last tide
        if (!prevTide && nextTide) {
            prevTide = { ...nextTide, hour: dayStartHour - 6 }; // Assume 6h period
        }
        if (!nextTide && prevTide) {
            nextTide = { ...prevTide, hour: dayEndHour + 6 }; // Assume 6h period
        }

        // Cosine interpolation between prevTide and nextTide
        if (prevTide && nextTide) {
            const hourRange = nextTide.hour - prevTide.hour;
            const progress = (hour - prevTide.hour) / hourRange;

            // Cosine interpolation for smooth S-curve
            const cosProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress);

            const height = prevTide.height + (nextTide.height - prevTide.height) * cosProgress;

            interpolatedPoints.push({ hour, height });
        }
    }

    // Find min/max height for scaling
    const allHeights = interpolatedPoints.map(p => p.height);
    const minHeight = Math.min(...allHeights, ...tidesWithHours.map(t => t.height));
    const maxHeight = Math.max(...allHeights, ...tidesWithHours.map(t => t.height));
    const heightRange = maxHeight - minHeight || 1; // Avoid division by zero

    // Create scaling functions
    /**
     * Scale hour to X coordinate
     * @param {number} hour - Hour (0-24)
     * @returns {number} X coordinate
     */
    const scaleX = (hour) => {
        return padding.left + ((hour - dayStartHour) / hourSpan) * chartWidth;
    };

    /**
     * Scale height to Y coordinate (inverted - higher values = lower Y)
     * @param {number} height - Tide height in meters
     * @returns {number} Y coordinate
     */
    const scaleY = (height) => {
        return padding.top + ((maxHeight - height) / heightRange) * chartHeight;
    };

    // Draw filled area under curve with gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, logicalHeight - padding.bottom);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.3)'); // Light blue
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.05)'); // Near transparent

    ctx.fillStyle = gradient;
    ctx.beginPath();

    // Start at bottom-left
    ctx.moveTo(padding.left, logicalHeight - padding.bottom);

    // Draw interpolated curve
    interpolatedPoints.forEach((point, i) => {
        const x = scaleX(point.hour);
        const y = scaleY(point.height);

        if (i === 0) {
            ctx.lineTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    // Close path at bottom-right
    ctx.lineTo(logicalWidth - padding.right, logicalHeight - padding.bottom);
    ctx.closePath();
    ctx.fill();

    // Draw tidal curve line
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8'; // Blue
    ctx.lineWidth = 2;

    interpolatedPoints.forEach((point, i) => {
        const x = scaleX(point.hour);
        const y = scaleY(point.height);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Mark high/low tide events
    tidesWithHours.forEach(tide => {
        const x = scaleX(tide.hour);
        const y = scaleY(tide.height);

        // Draw circle marker
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);

        if (tide.type === 'high') {
            ctx.fillStyle = '#22d3ee'; // Cyan for high tide
        } else {
            ctx.fillStyle = '#818cf8'; // Indigo for low tide
        }
        ctx.fill();

        // Draw time and height label
        const timeStr = tide.date.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
        const labelText = `${timeStr} (${tide.height.toFixed(1)}m)`;

        ctx.font = '9px system-ui, sans-serif';
        ctx.fillStyle = '#cbd5e1'; // Light gray
        ctx.textAlign = 'center';

        // Position label above high tides, below low tides
        if (tide.type === 'high') {
            ctx.fillText(labelText, x, y - 10);
        } else {
            ctx.fillText(labelText, x, y + 16);
        }
    });

    // Draw time axis
    const axisY = logicalHeight - padding.bottom;

    // Horizontal axis line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'; // Light gray
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, axisY);
    ctx.lineTo(logicalWidth - padding.right, axisY);
    ctx.stroke();

    // Time markers every 6 hours
    const timeMarkers = [0, 6, 12, 18];
    ctx.fillStyle = '#64748b'; // Medium gray
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'center';

    timeMarkers.forEach(hour => {
        if (hour >= dayStartHour && hour <= dayEndHour) {
            const x = scaleX(hour);
            const timeLabel = `${hour.toString().padStart(2, '0')}:00`;

            // Draw tick mark
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.beginPath();
            ctx.moveTo(x, axisY);
            ctx.lineTo(x, axisY + 4);
            ctx.stroke();

            // Draw time label
            ctx.fillText(timeLabel, x, axisY + 14);
        }
    });

    // Handle edge case: only 1 tide event
    if (tides.length === 1) {
        // Draw as peak/trough with extrapolated curve (already handled by interpolation logic)
        // Visual indication that this is limited data
        ctx.fillStyle = 'rgba(245, 158, 11, 0.6)'; // Orange warning
        ctx.font = '8px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Nur 1 Gezeitenereignis', logicalWidth - padding.right - 2, padding.top + 8);
    }
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { drawTidalTimeline };
}

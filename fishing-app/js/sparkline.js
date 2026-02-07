/**
 * PETRI HEIL - 48h Pressure Sparkline Canvas Renderer
 *
 * Renders a compact line chart showing atmospheric pressure trends
 * over 48 hours (24h past + 24h future) with color-coded zones,
 * "now" marker, and min/max labels.
 *
 * @module sparkline
 */

/**
 * Draw 48-hour pressure trend sparkline on canvas
 *
 * Displays pressure data with:
 * - Color-coded background zones (green=falling/good, orange=stable, red=rising)
 * - Blue pressure line
 * - Vertical dashed "now" marker with circle at intersection
 * - Min/max hPa labels
 *
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {Array<{time: string, value: number}>} pressureData - 48 data points (hourly)
 * @param {number} nowIndex - Index of current hour in pressureData array
 */
function drawPressureSparkline(canvas, pressureData, nowIndex) {
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
    const padding = { top: 12, right: 30, bottom: 12, left: 10 };

    // Filter out null/undefined values
    const validData = pressureData.filter(d => d && Number.isFinite(d.value));

    if (validData.length === 0) {
        // No valid data - draw placeholder text
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Keine Druckdaten verfügbar', logicalWidth / 2, logicalHeight / 2);
        return;
    }

    // Find min/max pressure values
    const pressureValues = validData.map(d => d.value);
    const min = Math.min(...pressureValues);
    const max = Math.max(...pressureValues);
    const range = max - min || 1; // Avoid division by zero

    // Create scaling functions
    const chartWidth = logicalWidth - padding.left - padding.right;
    const chartHeight = logicalHeight - padding.top - padding.bottom;

    /**
     * Scale data index to X coordinate
     * @param {number} index - Data point index
     * @returns {number} X coordinate
     */
    const scaleX = (index) => {
        return padding.left + (index / (pressureData.length - 1)) * chartWidth;
    };

    /**
     * Scale pressure value to Y coordinate (inverted - higher values = lower Y)
     * @param {number} value - Pressure value in hPa
     * @returns {number} Y coordinate
     */
    const scaleY = (value) => {
        return padding.top + ((max - value) / range) * chartHeight;
    };

    // Draw color-coded background zones
    for (let i = 0; i < pressureData.length - 1; i++) {
        const curr = pressureData[i];
        const next = pressureData[i + 1];

        // Skip if either value is null
        if (!curr || !next || !Number.isFinite(curr.value) || !Number.isFinite(next.value)) {
            continue;
        }

        // Calculate pressure difference
        const diff = next.value - curr.value;

        // Determine zone color
        let color;
        if (diff < -0.3) {
            // Falling pressure = good for fishing
            color = 'rgba(34, 197, 94, 0.15)'; // Green
        } else if (diff > 0.3) {
            // Rising pressure
            color = 'rgba(239, 68, 68, 0.15)'; // Red
        } else {
            // Stable pressure
            color = 'rgba(245, 158, 11, 0.15)'; // Orange
        }

        // Draw zone as vertical strip
        ctx.fillStyle = color;
        const x1 = scaleX(i);
        const x2 = scaleX(i + 1);
        ctx.fillRect(x1, 0, x2 - x1, logicalHeight);
    }

    // Draw pressure line
    ctx.beginPath();
    ctx.strokeStyle = '#0ea5e9'; // Blue
    ctx.lineWidth = 2;

    let firstPoint = true;
    pressureData.forEach((d, i) => {
        if (!d || !Number.isFinite(d.value)) {
            // Skip null values without breaking the line
            return;
        }

        const x = scaleX(i);
        const y = scaleY(d.value);

        if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw "now" marker
    if (nowIndex >= 0 && nowIndex < pressureData.length) {
        const nowData = pressureData[nowIndex];

        if (nowData && Number.isFinite(nowData.value)) {
            const nowX = scaleX(nowIndex);
            const nowY = scaleY(nowData.value);

            // Draw vertical dashed line
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);

            ctx.beginPath();
            ctx.moveTo(nowX, 0);
            ctx.lineTo(nowX, logicalHeight);
            ctx.stroke();

            // Reset dash
            ctx.setLineDash([]);

            // Draw circle at intersection with pressure line
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(nowX, nowY, 4, 0, 2 * Math.PI);
            ctx.fill();

            // Add stroke to circle for better visibility
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // Draw min/max hPa labels
    ctx.fillStyle = '#94a3b8'; // Light gray
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'right';

    // Max label at top-right
    ctx.fillText(Math.round(max) + ' hPa', logicalWidth - 2, padding.top + 10);

    // Min label at bottom-right
    ctx.fillText(Math.round(min) + ' hPa', logicalWidth - 2, logicalHeight - padding.bottom);
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { drawPressureSparkline };
}

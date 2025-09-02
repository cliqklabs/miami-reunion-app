// Helper function to load an image and return it as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Setting crossOrigin is good practice for canvas operations, even with data URLs
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`));
        img.src = src;
    });
}

/**
 * Creates a single "gallery" page image from a collection of Miami style images.
 * @param imageData A record mapping style names to their image data URLs.
 * @returns A promise that resolves to a data URL of the generated gallery page (JPEG format).
 */
export async function createGalleryPage(imageData: Record<string, string>): Promise<string> {
    const canvas = document.createElement('canvas');
    // High-resolution canvas for good quality (A4-like ratio)
    const canvasWidth = 2480;
    const canvasHeight = 3508;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get 2D canvas context');
    }

    // 1. Draw the gallery page background with Miami gradient
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, '#06b6d4'); // teal
    gradient.addColorStop(0.5, '#ec4899'); // pink
    gradient.addColorStop(1, '#f97316'); // orange
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Add some texture overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvasWidth;
        const y = Math.random() * canvasHeight;
        const radius = Math.random() * 100 + 20;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. Draw the title
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    ctx.font = `bold 120px 'Caveat', cursive`;
    ctx.fillText('Miami Reunion Gallery', canvasWidth / 2, 180);

    ctx.font = `60px 'Roboto', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Class of 2024', canvasWidth / 2, 260);

    // 3. Load all the polaroid images concurrently
    const styleNames = Object.keys(imageData);
    const loadedImages = await Promise.all(
        Object.values(imageData).map(url => loadImage(url))
    );

    const imagesWithStyles = styleNames.map((styleName, index) => ({
        styleName,
        img: loadedImages[index],
    }));

    // 4. Define grid layout and draw each polaroid
    const grid = { cols: 2, rows: 2, padding: 120 };
    const contentTopMargin = 320; // Space for the header
    const contentHeight = canvasHeight - contentTopMargin;
    const cellWidth = (canvasWidth - grid.padding * (grid.cols + 1)) / grid.cols;
    const cellHeight = (contentHeight - grid.padding * (grid.rows + 1)) / grid.rows;

    // Calculate polaroid dimensions to fit inside the grid cell with a margin
    const polaroidAspectRatio = 1.2; // height is 1.2 times width
    const maxPolaroidWidth = cellWidth * 0.85;
    const maxPolaroidHeight = cellHeight * 0.85;

    let polaroidWidth = maxPolaroidWidth;
    let polaroidHeight = polaroidWidth * polaroidAspectRatio;

    if (polaroidHeight > maxPolaroidHeight) {
        polaroidHeight = maxPolaroidHeight;
        polaroidWidth = polaroidHeight / polaroidAspectRatio;
    }

    const imageContainerWidth = polaroidWidth * 0.9;
    const imageContainerHeight = imageContainerWidth; // Classic square-ish photo area

    // Draw each polaroid
    imagesWithStyles.forEach(({ styleName, img }, index) => {
        const row = Math.floor(index / grid.cols);
        const col = index % grid.cols;

        // Calculate top-left corner of the polaroid within its grid cell
        const x = grid.padding * (col + 1) + cellWidth * col + (cellWidth - polaroidWidth) / 2;
        const y = contentTopMargin + grid.padding * (row + 1) + cellHeight * row + (cellHeight - polaroidHeight) / 2;

        ctx.save();

        // Translate context to the center of the polaroid for rotation
        ctx.translate(x + polaroidWidth / 2, y + polaroidHeight / 2);

        // Apply a slight, random rotation for a hand-placed look
        const rotation = (Math.random() - 0.5) * 0.1; // Radians (approx. +/- 2.8 degrees)
        ctx.rotate(rotation);

        // Draw a soft shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 12;

        // Draw the white polaroid frame (centered at the new origin)
        ctx.fillStyle = '#fff';
        ctx.fillRect(-polaroidWidth / 2, -polaroidHeight / 2, polaroidWidth, polaroidHeight);

        // Remove shadow for subsequent drawing
        ctx.shadowColor = 'transparent';

        // Calculate image dimensions to fit while maintaining aspect ratio
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let drawWidth = imageContainerWidth;
        let drawHeight = drawWidth / aspectRatio;

        if (drawHeight > imageContainerHeight) {
            drawHeight = imageContainerHeight;
            drawWidth = drawHeight * aspectRatio;
        }

        // Calculate position to center the image within its container area
        const imageAreaTopMargin = (polaroidWidth - imageContainerWidth) / 2;
        const imageContainerY = -polaroidHeight / 2 + imageAreaTopMargin;

        const imgX = -drawWidth / 2; // Horizontally centered due to context translation
        const imgY = imageContainerY + (imageContainerHeight - drawHeight) / 2;

        ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight);

        // Draw the handwritten caption
        ctx.fillStyle = '#222';
        ctx.font = `bold 48px 'Permanent Marker', cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const captionAreaTop = imageContainerY + imageContainerHeight;
        const captionAreaBottom = polaroidHeight / 2;
        const captionY = captionAreaTop + (captionAreaBottom - captionAreaTop) / 2;

        ctx.fillText(styleName, 0, captionY);

        ctx.restore(); // Restore context to pre-transformation state
    });

    // Convert canvas to a high-quality JPEG and return the data URL
    return canvas.toDataURL('image/jpeg', 0.95);
}

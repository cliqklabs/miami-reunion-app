# Admin Gallery Management

This is a standalone admin interface for managing the Miami Vice 2025 gallery.

## Access

### Development
Navigate to: `http://localhost:3000/admin.html`

### Production
Navigate to: `https://your-domain.com/admin.html`

## Features

- **View All Gallery Images**: See all images that users have added to the gallery
- **Remove Images**: Click the red X button on any image to remove it from the gallery
- **Auto-refresh**: Images disappear immediately when removed
- **Manual Refresh**: Click the refresh button to reload the gallery

## How It Works

- Images are not permanently deleted from the database
- Clicking the X button sets the `inGallery` status to `false`
- This removes the image from the public gallery while preserving the data
- Users will no longer see the removed images in the "Hou' Gallery"

## Security Note

This admin page is currently accessible to anyone who knows the URL. For production use, consider implementing authentication or restricting access at the server level.

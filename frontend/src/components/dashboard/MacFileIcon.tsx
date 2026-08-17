import React, { useState } from 'react'

interface MacFileIconProps {
  name: string
  mimeType: string
  thumbnailLink?: string
  size?: 'sm' | 'md' | 'lg'
}

export const MacFileIcon: React.FC<MacFileIconProps> = ({
  name,
  mimeType,
  thumbnailLink,
  size = 'md',
}) => {
  const [imgError, setImgError] = useState(false)
  const ext = name.split('.').pop()?.toUpperCase() || ''

  const isFolder = mimeType === 'application/vnd.google-apps.folder' || mimeType === 'folder'
  const isImage = mimeType.startsWith('image/') || ['PNG', 'JPG', 'JPEG', 'HEIC', 'WEBP', 'GIF', 'SVG'].includes(ext)
  const isPdf = mimeType === 'application/pdf' || ext === 'PDF'
  const isVideo = mimeType.startsWith('video/') || ['MKV', 'MP4', 'MOV', 'AVI', 'WEBM'].includes(ext)
  const isZip = mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('compressed') || ['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)
  const isAudio = mimeType.startsWith('audio/') || ['MP3', 'WAV', 'AAC', 'M4A', 'FLAC'].includes(ext)

  // Sizing definitions
  const containerClasses = {
    sm: 'h-6 w-6',
    md: 'h-16 w-20',
    lg: 'h-24 w-28',
  }[size]

  // 1. Real Image / Thumbnail Preview (for images & PDF thumbnails)
  if (thumbnailLink && !imgError && (isImage || isPdf)) {
    return (
      <div className={`relative flex items-center justify-center ${containerClasses}`}>
        <img
          src={thumbnailLink.replace(/=s\d+/, size === 'sm' ? '=s64' : '=s220')}
          alt={name}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          className={`${
            size === 'sm'
              ? 'h-6 w-6 rounded object-cover'
              : 'max-h-16 max-w-16 rounded-md object-contain shadow-md shadow-black/40 border border-white/10'
          }`}
        />
      </div>
    )
  }

  // 2. macOS Blue Folder
  if (isFolder) {
    return (
      <div className={`relative flex items-center justify-center ${containerClasses}`}>
        <svg viewBox="0 0 100 80" className="h-full w-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]">
          <defs>
            <linearGradient id="macFolderBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3ca2ee" />
              <stop offset="100%" stopColor="#1e7dd8" />
            </linearGradient>
            <linearGradient id="macFolderFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#67bcf7" />
              <stop offset="15%" stopColor="#4eaef5" />
              <stop offset="100%" stopColor="#2588df" />
            </linearGradient>
          </defs>
          {/* Back tab */}
          <path
            d="M 6 16 C 6 10 10 7 16 7 L 36 7 C 42 7 45 10 49 14 L 54 18 L 86 18 C 92 18 96 22 96 28 L 96 66 C 96 72 92 76 86 76 L 14 76 C 8 76 4 72 4 66 Z"
            fill="url(#macFolderBack)"
          />
          {/* Inner paper hint */}
          <rect x="12" y="16" width="76" height="40" rx="3" fill="#ffffff" opacity="0.85" />
          {/* Front flap */}
          <path
            d="M 4 27 C 4 23 7 21 12 21 L 88 21 C 93 21 96 23 96 27 L 96 67 C 96 73 92 77 86 77 L 14 77 C 8 77 4 73 4 67 Z"
            fill="url(#macFolderFront)"
          />
        </svg>
      </div>
    )
  }

  // 3. macOS Video Icon (VLC cone or video document)
  if (isVideo) {
    return (
      <div className={`relative flex items-center justify-center ${containerClasses}`}>
        <svg viewBox="0 0 64 80" className="h-full w-full drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]">
          {/* Paper sheet */}
          <path d="M 6 4 L 46 4 L 58 16 L 58 74 C 58 77 56 79 53 79 L 11 79 C 8 79 6 77 6 74 Z" fill="#e8eaed" />
          {/* Dog ear */}
          <path d="M 46 4 L 46 16 L 58 16 Z" fill="#c4c7cc" />
          {/* Traffic cone base */}
          <ellipse cx="32" cy="62" rx="16" ry="6" fill="#e65100" />
          <ellipse cx="32" cy="60" rx="14" ry="4" fill="#f57c00" />
          {/* Cone body */}
          <path d="M 22 58 L 29 25 L 35 25 L 42 58 Z" fill="#ff6f00" />
          {/* Stripe 1 */}
          <path d="M 24 50 L 26 42 L 38 42 L 40 50 Z" fill="#ffffff" />
          {/* Stripe 2 */}
          <path d="M 27 36 L 28.5 30 L 35.5 30 L 37 36 Z" fill="#ffffff" />
          {/* MKV/MP4 text badge */}
          {size !== 'sm' && (
            <text x="32" y="72" fontSize="7" fontWeight="bold" fill="#333" textAnchor="middle" fontFamily="sans-serif">
              {ext || 'VIDEO'}
            </text>
          )}
        </svg>
      </div>
    )
  }

  // 4. macOS ZIP Archive Icon
  if (isZip) {
    return (
      <div className={`relative flex items-center justify-center ${containerClasses}`}>
        <svg viewBox="0 0 64 80" className="h-full w-full drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]">
          {/* Paper sheet */}
          <path d="M 6 4 L 46 4 L 58 16 L 58 74 C 58 77 56 79 53 79 L 11 79 C 8 79 6 77 6 74 Z" fill="#f0f2f5" />
          {/* Dog ear */}
          <path d="M 46 4 L 46 16 L 58 16 Z" fill="#cdd1d8" />
          {/* Zipper track */}
          <rect x="30.5" y="10" width="3" height="42" fill="#9e9e9e" rx="1" />
          {/* Teeth */}
          {[14, 20, 26, 32, 38, 44].map((y, i) => (
            <rect key={i} x={i % 2 === 0 ? "28.5" : "32.5"} y={y} width="3" height="2" fill="#757575" rx="0.5" />
          ))}
          {/* Zipper pull */}
          <rect x="29" y="46" width="6" height="8" rx="1.5" fill="#616161" />
          <rect x="30.5" y="54" width="3" height="6" rx="1" fill="#757575" />
          {/* ZIP badge */}
          {size !== 'sm' && (
            <text x="32" y="70" fontSize="8" fontWeight="bold" fill="#757575" textAnchor="middle" fontFamily="sans-serif">
              ZIP
            </text>
          )}
        </svg>
      </div>
    )
  }

  // 5. macOS PDF Icon
  if (isPdf) {
    return (
      <div className={`relative flex items-center justify-center ${containerClasses}`}>
        <svg viewBox="0 0 64 80" className="h-full w-full drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]">
          {/* Paper sheet */}
          <path d="M 6 4 L 46 4 L 58 16 L 58 74 C 58 77 56 79 53 79 L 11 79 C 8 79 6 77 6 74 Z" fill="#ffffff" />
          {/* Dog ear */}
          <path d="M 46 4 L 46 16 L 58 16 Z" fill="#e0e0e0" />
          {/* Document lines simulation */}
          <rect x="14" y="24" width="36" height="3" rx="1.5" fill="#e0e0e0" />
          <rect x="14" y="32" width="36" height="3" rx="1.5" fill="#eeeeee" />
          <rect x="14" y="40" width="28" height="3" rx="1.5" fill="#eeeeee" />
          <rect x="14" y="48" width="32" height="3" rx="1.5" fill="#eeeeee" />
          {/* PDF red banner */}
          <rect x="6" y="58" width="52" height="15" fill="#ea4335" rx="2" />
          <text x="32" y="69" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">
            PDF
          </text>
        </svg>
      </div>
    )
  }

  // 6. macOS Audio Icon
  if (isAudio) {
    return (
      <div className={`relative flex items-center justify-center ${containerClasses}`}>
        <svg viewBox="0 0 64 80" className="h-full w-full drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]">
          <path d="M 6 4 L 46 4 L 58 16 L 58 74 C 58 77 56 79 53 79 L 11 79 C 8 79 6 77 6 74 Z" fill="#ffffff" />
          <path d="M 46 4 L 46 16 L 58 16 Z" fill="#e0e0e0" />
          {/* Note icon */}
          <circle cx="24" cy="52" r="6" fill="#ec4899" />
          <circle cx="40" cy="46" r="6" fill="#ec4899" />
          <rect x="28" y="22" width="4" height="30" fill="#ec4899" />
          <rect x="44" y="16" width="4" height="30" fill="#ec4899" />
          <path d="M 28 22 L 48 16 L 48 22 L 28 28 Z" fill="#ec4899" />
          {size !== 'sm' && (
            <text x="32" y="70" fontSize="7.5" fontWeight="bold" fill="#ec4899" textAnchor="middle" fontFamily="sans-serif">
              {ext || 'AUDIO'}
            </text>
          )}
        </svg>
      </div>
    )
  }

  // 7. Generic Document / Other Files
  return (
    <div className={`relative flex items-center justify-center ${containerClasses}`}>
      <svg viewBox="0 0 64 80" className="h-full w-full drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]">
        {/* Paper sheet */}
        <path d="M 6 4 L 46 4 L 58 16 L 58 74 C 58 77 56 79 53 79 L 11 79 C 8 79 6 77 6 74 Z" fill="#f8f9fa" />
        {/* Dog ear */}
        <path d="M 46 4 L 46 16 L 58 16 Z" fill="#d2d6dc" />
        {/* Document lines */}
        <rect x="14" y="26" width="36" height="3" rx="1.5" fill="#d2d6dc" />
        <rect x="14" y="34" width="36" height="3" rx="1.5" fill="#e5e7eb" />
        <rect x="14" y="42" width="24" height="3" rx="1.5" fill="#e5e7eb" />
        <rect x="14" y="50" width="30" height="3" rx="1.5" fill="#e5e7eb" />
        {/* Extension badge */}
        {ext && size !== 'sm' && (
          <text x="32" y="70" fontSize="7.5" fontWeight="bold" fill="#6b7280" textAnchor="middle" fontFamily="sans-serif">
            {ext.slice(0, 5)}
          </text>
        )}
      </svg>
    </div>
  )
}

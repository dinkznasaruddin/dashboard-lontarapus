"use client";

import { useState } from "react";

/** Gambar eksternal yang menangani onError sendiri (server component
 *  tidak boleh mengoper event handler). */
export function RemoteImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setHidden(true)}
    />
  );
}